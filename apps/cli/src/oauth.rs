use crate::store::{self, OauthTokens};
use anyhow::{Context, Result, anyhow, bail};
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::os::unix::fs::OpenOptionsExt;
use std::sync::{LazyLock, mpsc};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use ureq::tls::{RootCerts, TlsConfig};
use url::Url;

/// The installed (curl | bash) collector always talks to production; the repo
/// can point `AGENT_USAGE_URL` at a local dev server instead.
pub const PRODUCTION_ISSUER: &str = "https://ruchern.dev";
pub const OAUTH_SCOPES: &str = "openid profile email offline_access mcp";
pub const OAUTH_REDIRECT_URI: &str = "http://127.0.0.1:8741/callback";
pub const OAUTH_LISTEN_ADDR: &str = "127.0.0.1:8741";
pub const OAUTH_CLIENT_NAME: &str = "agent-usage";

/// Origin of the ingest endpoint, so login and ingest always hit the same server.
#[cfg(not(test))]
pub fn issuer() -> String {
    Url::parse(&crate::ingest::endpoint())
        .map(|url| url.origin().ascii_serialization())
        .unwrap_or_else(|_| PRODUCTION_ISSUER.to_string())
}

/// Tests stay on production regardless of the developer's environment.
#[cfg(test)]
pub fn issuer() -> String {
    PRODUCTION_ISSUER.to_string()
}

fn resource() -> String {
    format!("{}/api/auth", issuer())
}

/// Shared HTTP agent that trusts the OS certificate store, so a local dev
/// server's certificate (e.g. portless on `*.localhost`) verifies like in curl.
pub fn http() -> &'static ureq::Agent {
    static AGENT: LazyLock<ureq::Agent> = LazyLock::new(|| {
        ureq::Agent::config_builder()
            .tls_config(
                TlsConfig::builder()
                    .root_certs(RootCerts::PlatformVerifier)
                    .build(),
            )
            .build()
            .new_agent()
    });
    &AGENT
}

pub fn login() -> Result<()> {
    let discovery = discover_oidc();
    let client_id = load_or_register_client(&discovery.registration_endpoint)?;

    let (verifier, challenge) = pkce()?;
    let state = random_b64(16)?;

    let mut auth_url = Url::parse(&discovery.authorization_endpoint).with_context(|| {
        format!(
            "parse authorization endpoint {}",
            discovery.authorization_endpoint
        )
    })?;
    auth_url
        .query_pairs_mut()
        .append_pair("response_type", "code")
        .append_pair("client_id", &client_id)
        .append_pair("redirect_uri", OAUTH_REDIRECT_URI)
        .append_pair("scope", OAUTH_SCOPES)
        .append_pair("state", &state)
        .append_pair("code_challenge", &challenge)
        .append_pair("code_challenge_method", "S256")
        .append_pair("resource", &resource());

    let code = match wait_for_code(auth_url.as_str(), &state) {
        Ok(code) => code,
        Err(error) => {
            if is_invalid_target(Some(&error)) {
                let _ = std::fs::remove_file(store::client_id_path());
                return Err(anyhow!(
                    "{error:#} (cached client dropped — run: agent-usage auth login)"
                ));
            }
            return Err(error);
        }
    };

    let mut tokens = exchange_code(&discovery.token_endpoint, &client_id, &code, &verifier)?;
    tokens.client_id = client_id;
    if let Ok(email) = fetch_email(&discovery.userinfo_endpoint, &tokens.access_token) {
        tokens.email = email;
    }
    store::save_tokens(&tokens)?;

    if tokens.email.is_empty() {
        println!("Signed in. Ingest requires an admin account.");
    } else {
        println!(
            "Signed in as {}. Ingest requires an admin account.",
            tokens.email
        );
    }
    Ok(())
}

pub fn logout() -> Result<()> {
    let _ = std::fs::remove_file(store::client_id_path());
    store::delete_tokens()?;
    println!("Signed out.");
    Ok(())
}

/// Prints the server, whether tokens are stored for it, and their expiry,
/// from the Keychain alone (no network). Fails when not signed in.
pub fn status() -> Result<()> {
    let tokens = store::stored_tokens()?;
    let (report, signed_in) = status_report(&issuer(), tokens.as_ref(), unix_now());
    print!("{report}");
    if !signed_in {
        bail!(store::not_signed_in());
    }
    Ok(())
}

/// Testable core of [`status`]: the report text and whether a run could get a
/// bearer token (an unexpired access token, or a refresh token to renew it).
fn status_report(server: &str, tokens: Option<&OauthTokens>, now: i64) -> (String, bool) {
    let mut report = format!("Server:        {server}\n");
    let Some(tokens) = tokens else {
        report.push_str("Signed in:     no (no tokens stored)\n");
        return (report, false);
    };
    let access_valid = !tokens.access_token.is_empty() && now < tokens.expiry_unix;
    let has_refresh = !tokens.refresh_token.is_empty();
    let signed_in = access_valid || has_refresh;

    let who = if tokens.email.is_empty() {
        String::new()
    } else {
        format!(" as {}", tokens.email)
    };
    let signed_in_line = if signed_in {
        format!("yes{who}")
    } else {
        format!("no (session expired{who})")
    };
    report.push_str(&format!("Signed in:     {signed_in_line}\n"));

    let expiry = chrono::DateTime::from_timestamp(tokens.expiry_unix, 0)
        .map(|at| {
            at.with_timezone(&chrono::Local)
                .format("%d/%m/%Y %H:%M")
                .to_string()
        })
        .unwrap_or_else(|| tokens.expiry_unix.to_string());
    let access_line = if tokens.access_token.is_empty() {
        "none".to_string()
    } else if access_valid {
        format!("valid until {expiry}")
    } else {
        format!("expired {expiry}")
    };
    report.push_str(&format!("Access token:  {access_line}\n"));
    report.push_str(&format!(
        "Refresh token: {}\n",
        if has_refresh { "stored" } else { "none" }
    ));
    (report, signed_in)
}

pub fn bearer_token() -> Result<String> {
    // Better Auth rotates refresh tokens and revokes the whole family on reuse,
    // so two runs refreshing with the same token (the 15-minute LaunchAgent and a
    // manual run) would both be signed out. Hold a lock across load, refresh
    // and save so the second run reads the token the first one saved.
    let _lock = store::lock_tokens()?;

    let tokens = store::load_tokens()?;
    if !tokens.access_token.is_empty() && unix_now() < tokens.expiry_unix {
        return Ok(tokens.access_token);
    }
    if tokens.refresh_token.is_empty() {
        bail!(store::not_signed_in());
    }
    let config = discover_oidc();
    let refreshed = refresh_tokens(&config.token_endpoint, &tokens).map_err(|error| {
        anyhow!(
            "token refresh failed ({error:#}) — run: {}",
            crate::ingest::login_command()
        )
    })?;
    store::save_tokens(&refreshed)?;
    Ok(refreshed.access_token)
}

pub fn unix_now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_secs() as i64)
        .unwrap_or(0)
}

#[derive(Clone, Debug, Default, Deserialize)]
pub struct OidcDiscovery {
    #[serde(default)]
    pub authorization_endpoint: String,
    #[serde(default)]
    pub token_endpoint: String,
    #[serde(default)]
    pub registration_endpoint: String,
    #[serde(default)]
    pub userinfo_endpoint: String,
}

/// Never fails: falls back to the issuer's well-known paths.
fn discover_oidc() -> OidcDiscovery {
    let issuer = issuer();
    let fallback = OidcDiscovery {
        authorization_endpoint: format!("{issuer}/api/auth/oauth2/authorize"),
        token_endpoint: format!("{issuer}/api/auth/oauth2/token"),
        registration_endpoint: format!("{issuer}/api/auth/oauth2/register"),
        userinfo_endpoint: format!("{issuer}/api/auth/oauth2/userinfo"),
    };

    let attempt = (|| -> Result<OidcDiscovery> {
        let mut response = http()
            .get(format!(
                "{issuer}/api/auth/.well-known/openid-configuration"
            ))
            .header("Origin", &issuer)
            .call()?;
        if response.status().as_u16() != 200 {
            bail!("discovery status {}", response.status());
        }
        let mut cfg: OidcDiscovery = serde_json::from_reader(response.body_mut().as_reader())?;
        if cfg.authorization_endpoint.is_empty() {
            bail!("missing authorization_endpoint");
        }
        if cfg.registration_endpoint.is_empty() {
            cfg.registration_endpoint = fallback.registration_endpoint.clone();
        }
        Ok(cfg)
    })();

    attempt.unwrap_or(fallback)
}

fn load_or_register_client(register_url: &str) -> Result<String> {
    if let Ok(id) = std::fs::read_to_string(store::client_id_path()) {
        let id = id.trim();
        if !id.is_empty() {
            return Ok(id.to_string());
        }
    }

    let body = serde_json::to_string(&serde_json::json!({
        "client_name": OAUTH_CLIENT_NAME,
        "application_type": "native",
        "token_endpoint_auth_method": "none",
        "redirect_uris": [OAUTH_REDIRECT_URI],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "scope": OAUTH_SCOPES,
        "resources": [resource()],
    }))?;

    let mut response = http()
        .post(register_url)
        .header("content-type", "application/json")
        .header("Origin", issuer())
        .config()
        .http_status_as_error(false)
        .build()
        .send(body)?;

    let status = response.status().as_u16();
    let raw = read_capped(&mut response);
    if !(200..300).contains(&status) {
        bail!("client registration {status}: {}", raw.trim());
    }

    #[derive(Deserialize, Default)]
    struct Registered {
        #[serde(default)]
        client_id: String,
    }
    let parsed: Registered = serde_json::from_str(&raw).unwrap_or_default();
    if parsed.client_id.is_empty() {
        bail!("client registration: missing client_id");
    }

    store::ensure_config_dir()?;
    let path = store::client_id_path();
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .mode(0o600)
        .open(&path)
        .with_context(|| format!("open {}", path.display()))?;
    file.write_all(format!("{}\n", parsed.client_id).as_bytes())?;

    Ok(parsed.client_id)
}

/// Runs a one-shot local HTTP server on [`OAUTH_LISTEN_ADDR`] and waits for the
/// OAuth redirect to hit `/callback`, or for a five-minute timeout.
fn wait_for_code(auth_url: &str, state: &str) -> Result<String> {
    let listener = TcpListener::bind(OAUTH_LISTEN_ADDR).map_err(|error| {
        anyhow!("listen {OAUTH_LISTEN_ADDR}: {error} (is another login in progress?)")
    })?;

    let (tx, rx) = mpsc::channel::<Result<String>>();
    let state = state.to_string();
    thread::spawn(move || {
        for stream in listener.incoming().flatten() {
            if let Some(outcome) = handle_callback(stream, &state) {
                let _ = tx.send(outcome);
                return;
            }
        }
    });

    println!("Opening the browser to sign in…");
    if std::process::Command::new("open")
        .arg(auth_url)
        .spawn()
        .is_err()
    {
        println!("{auth_url}");
    }

    rx.recv_timeout(Duration::from_secs(5 * 60))
        .unwrap_or_else(|_| Err(anyhow!("login timed out")))
}

/// Handles a single connection. Returns `None` for anything that isn't the
/// `/callback` request (e.g. a browser favicon probe), so the caller keeps
/// listening for the real redirect.
fn handle_callback(mut stream: TcpStream, state: &str) -> Option<Result<String>> {
    let mut reader = BufReader::new(stream.try_clone().ok()?);
    let mut request_line = String::new();
    if reader.read_line(&mut request_line).ok()? == 0 {
        return None;
    }
    // Drain the remaining request headers so the client isn't reset before it
    // gets a response.
    loop {
        let mut line = String::new();
        match reader.read_line(&mut line) {
            Ok(0) => break,
            Ok(_) if line == "\r\n" || line == "\n" => break,
            Ok(_) => continue,
            Err(_) => break,
        }
    }

    let path = request_line.split_whitespace().nth(1).unwrap_or("/");
    if !path.starts_with("/callback") {
        respond(&mut stream, 404, "Not Found", "not found");
        return None;
    }

    let parsed = Url::parse(&format!("http://{OAUTH_LISTEN_ADDR}{path}")).ok()?;
    let query: HashMap<String, String> = parsed.query_pairs().into_owned().collect();

    if let Some(error_param) = query.get("error") {
        let mut message = error_param.clone();
        if let Some(description) = query.get("error_description") {
            message = format!("{message}: {description}");
        }
        respond(
            &mut stream,
            200,
            "OK",
            "Sign-in failed. You can close this tab.",
        );
        return Some(Err(anyhow!(message)));
    }
    if query.get("state").map(String::as_str) != Some(state) {
        respond(&mut stream, 400, "Bad Request", "state mismatch");
        return Some(Err(anyhow!("oauth state mismatch")));
    }
    match query.get("code").filter(|code| !code.is_empty()) {
        Some(code) => {
            respond(&mut stream, 200, "OK", "Signed in. You can close this tab.");
            Some(Ok(code.clone()))
        }
        None => {
            respond(&mut stream, 400, "Bad Request", "missing code");
            Some(Err(anyhow!("oauth missing code")))
        }
    }
}

fn respond(stream: &mut TcpStream, status: u16, reason: &str, body: &str) {
    let response = format!(
        "HTTP/1.1 {status} {reason}\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    let _ = stream.write_all(response.as_bytes());
}

fn exchange_code(
    token_url: &str,
    client_id: &str,
    code: &str,
    verifier: &str,
) -> Result<OauthTokens> {
    post_token(
        token_url,
        &[
            ("grant_type", "authorization_code"),
            ("code", code),
            ("redirect_uri", OAUTH_REDIRECT_URI),
            ("client_id", client_id),
            ("code_verifier", verifier),
            ("resource", &resource()),
        ],
        client_id,
    )
}

fn refresh_tokens(token_url: &str, existing: &OauthTokens) -> Result<OauthTokens> {
    let mut tokens = post_token(
        token_url,
        &[
            ("grant_type", "refresh_token"),
            ("refresh_token", &existing.refresh_token),
            ("client_id", &existing.client_id),
            ("resource", &resource()),
        ],
        &existing.client_id,
    )?;
    if tokens.refresh_token.is_empty() {
        tokens.refresh_token = existing.refresh_token.clone();
    }
    tokens.email = existing.email.clone();
    Ok(tokens)
}

fn post_token(token_url: &str, form: &[(&str, &str)], client_id: &str) -> Result<OauthTokens> {
    let mut response = http()
        .post(token_url)
        .header("Origin", issuer())
        .config()
        .http_status_as_error(false)
        .build()
        .send_form(form.iter().copied())?;

    let status = response.status().as_u16();
    let raw = read_capped(&mut response);
    if !(200..300).contains(&status) {
        bail!("token endpoint {status}: {}", raw.trim());
    }

    #[derive(Deserialize, Default)]
    struct TokenResponse {
        #[serde(default)]
        access_token: String,
        #[serde(default)]
        refresh_token: String,
        #[serde(default)]
        expires_in: i64,
    }
    let parsed: TokenResponse = serde_json::from_str(&raw)?;
    if parsed.access_token.is_empty() {
        bail!("token endpoint: missing access_token");
    }
    let expires_in = if parsed.expires_in <= 0 {
        3600
    } else {
        parsed.expires_in
    };

    Ok(OauthTokens {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
        expiry_unix: unix_now() + expires_in - 60,
        client_id: client_id.to_string(),
        email: String::new(),
    })
}

fn fetch_email(userinfo_url: &str, access_token: &str) -> Result<String> {
    if userinfo_url.is_empty() {
        bail!("no userinfo");
    }
    let mut response = http()
        .get(userinfo_url)
        .header("authorization", format!("Bearer {access_token}"))
        .header("Origin", issuer())
        .config()
        .http_status_as_error(false)
        .build()
        .call()?;

    #[derive(Deserialize, Default)]
    struct UserInfo {
        #[serde(default)]
        email: String,
    }
    let parsed: UserInfo = serde_json::from_reader(response.body_mut().as_reader())?;
    Ok(parsed.email)
}

/// Reads a response body capped at 1 MiB, ignoring any read error (the caller
/// only needs the raw bytes for a status message or JSON parse attempt).
fn read_capped(response: &mut ureq::http::Response<ureq::Body>) -> String {
    response
        .body_mut()
        .with_config()
        .limit(1 << 20)
        .lossy_utf8(true)
        .read_to_string()
        .unwrap_or_default()
}

fn pkce() -> Result<(String, String)> {
    let verifier = random_b64(32)?;
    let digest = Sha256::digest(verifier.as_bytes());
    let challenge = URL_SAFE_NO_PAD.encode(digest);
    Ok((verifier, challenge))
}

fn random_b64(n: usize) -> Result<String> {
    let mut buf = vec![0u8; n];
    getrandom::fill(&mut buf)?;
    Ok(URL_SAFE_NO_PAD.encode(buf))
}

fn is_invalid_target(error: Option<&anyhow::Error>) -> bool {
    error.is_some_and(|error| error.to_string().contains("invalid_target"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    fn s256(verifier: &str) -> String {
        let digest = Sha256::digest(verifier.as_bytes());
        URL_SAFE_NO_PAD.encode(digest)
    }

    fn is_unreserved(c: char) -> bool {
        c.is_ascii_alphanumeric() || matches!(c, '-' | '.' | '_' | '~')
    }

    #[test]
    fn s256_matches_rfc7636_vector() {
        let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        let challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
        assert_eq!(s256(verifier), challenge);
    }

    #[test]
    fn pkce_produces_valid_verifier_and_challenge() {
        let mut seen = HashSet::new();
        for _ in 0..50 {
            let (verifier, challenge) = pkce().unwrap();
            assert!(
                (43..=128).contains(&verifier.len()),
                "verifier {verifier:?} is not 43-128 characters"
            );
            assert!(
                verifier.chars().all(is_unreserved),
                "verifier {verifier:?} is not unreserved characters"
            );
            assert_eq!(
                challenge,
                s256(&verifier),
                "challenge is not S256(verifier)"
            );
            assert_eq!(
                challenge.len(),
                43,
                "challenge {challenge:?} is not 43 characters"
            );
            assert!(
                !challenge.contains(['+', '/', '=']),
                "challenge {challenge:?} is not unpadded base64url"
            );
            assert!(
                seen.insert(verifier.clone()),
                "verifier {verifier:?} repeated"
            );
        }
    }

    #[test]
    fn random_b64_has_expected_length_and_uniqueness() {
        for (n, want_len) in [(16usize, 22usize), (32, 43)] {
            let mut seen = HashSet::new();
            for _ in 0..50 {
                let got = random_b64(n).unwrap();
                assert_eq!(got.len(), want_len, "random_b64({n}) length");
                let raw = URL_SAFE_NO_PAD.decode(&got).unwrap();
                assert_eq!(raw.len(), n, "random_b64({n}) decoded length");
                assert!(seen.insert(got.clone()), "random_b64({n}) repeated {got:?}");
            }
        }
    }

    #[test]
    fn is_invalid_target_matches_error_text() {
        assert!(!is_invalid_target(None));
        assert!(is_invalid_target(Some(&anyhow!(
            "invalid_target: resource not allowed"
        ))));
        assert!(!is_invalid_target(Some(&anyhow!("access_denied"))));
    }

    #[test]
    fn exchange_code_sends_pkce_form() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("POST", "/")
            .match_header("content-type", "application/x-www-form-urlencoded")
            .match_header("origin", PRODUCTION_ISSUER)
            .match_body(mockito::Matcher::AllOf(vec![
                mockito::Matcher::UrlEncoded("grant_type".into(), "authorization_code".into()),
                mockito::Matcher::UrlEncoded("code".into(), "code-1".into()),
                mockito::Matcher::UrlEncoded("redirect_uri".into(), OAUTH_REDIRECT_URI.into()),
                mockito::Matcher::UrlEncoded("client_id".into(), "client-1".into()),
                mockito::Matcher::UrlEncoded("code_verifier".into(), "verifier-1".into()),
                mockito::Matcher::UrlEncoded("resource".into(), resource()),
            ]))
            .with_status(200)
            .with_body(r#"{"access_token":"access","refresh_token":"refresh","expires_in":600}"#)
            .create();

        let before = unix_now();
        let tokens = exchange_code(&server.url(), "client-1", "code-1", "verifier-1").unwrap();
        let after = unix_now();

        mock.assert();
        assert_eq!(tokens.access_token, "access");
        assert_eq!(tokens.refresh_token, "refresh");
        assert_eq!(tokens.client_id, "client-1");
        assert!(
            (before + 540..=after + 540).contains(&tokens.expiry_unix),
            "expiry {} not in expected range",
            tokens.expiry_unix
        );
    }

    #[test]
    fn post_token_handles_status_and_body() {
        struct Case {
            name: &'static str,
            status: usize,
            body: &'static str,
            want_err: Option<&'static str>,
            want_expires: i64,
        }
        let cases = [
            Case {
                name: "default expiry",
                status: 200,
                body: r#"{"access_token":"a"}"#,
                want_err: None,
                want_expires: 3540,
            },
            Case {
                name: "missing access token",
                status: 200,
                body: r#"{"refresh_token":"r"}"#,
                want_err: Some("missing access_token"),
                want_expires: 0,
            },
            // Deviation from Go: serde_json's parse-error text ("expected value…")
            // differs from encoding/json's ("invalid character…"), so this case only
            // asserts that parsing fails, not the exact wording.
            Case {
                name: "invalid JSON",
                status: 200,
                body: "not json",
                want_err: Some(""),
                want_expires: 0,
            },
            Case {
                name: "error status",
                status: 400,
                body: r#"{"error":"invalid_grant"}"#,
                want_err: Some(r#"token endpoint 400: {"error":"invalid_grant"}"#),
                want_expires: 0,
            },
        ];

        for case in cases {
            let mut server = mockito::Server::new();
            server
                .mock("POST", "/")
                .with_status(case.status)
                .with_body(case.body)
                .create();

            let before = unix_now();
            let result = post_token(&server.url(), &[], "client");
            let after = unix_now();

            match case.want_err {
                Some(text) if !text.is_empty() => {
                    let error = result.expect_err(&format!("{}: expected error", case.name));
                    assert!(
                        error.to_string().contains(text),
                        "{}: err = {error}, want containing {text:?}",
                        case.name
                    );
                }
                Some(_) => {
                    assert!(result.is_err(), "{}: expected error", case.name);
                }
                None => {
                    let tokens = result.unwrap_or_else(|error| panic!("{}: {error}", case.name));
                    assert!(
                        (before + case.want_expires..=after + case.want_expires)
                            .contains(&tokens.expiry_unix),
                        "{}: expiry {} not now+{}",
                        case.name,
                        tokens.expiry_unix,
                        case.want_expires
                    );
                }
            }
        }
    }

    #[test]
    fn refresh_tokens_preserves_or_rotates_refresh_token() {
        let existing = OauthTokens {
            access_token: "old".into(),
            refresh_token: "old-refresh".into(),
            client_id: "client-1".into(),
            email: "me@example.com".into(),
            ..Default::default()
        };

        for (name, body, want_refresh) in [
            (
                "keeps refresh token when none returned",
                r#"{"access_token":"new"}"#,
                "old-refresh",
            ),
            (
                "rotates refresh token",
                r#"{"access_token":"new","refresh_token":"new-refresh"}"#,
                "new-refresh",
            ),
        ] {
            let mut server = mockito::Server::new();
            let mock = server
                .mock("POST", "/")
                .match_body(mockito::Matcher::AllOf(vec![
                    mockito::Matcher::UrlEncoded("grant_type".into(), "refresh_token".into()),
                    mockito::Matcher::UrlEncoded("refresh_token".into(), "old-refresh".into()),
                    mockito::Matcher::UrlEncoded("client_id".into(), "client-1".into()),
                    mockito::Matcher::UrlEncoded("resource".into(), resource()),
                ]))
                .with_body(body)
                .create();

            let tokens = refresh_tokens(&server.url(), &existing)
                .unwrap_or_else(|error| panic!("{name}: {error}"));
            mock.assert();
            assert_eq!(tokens.access_token, "new", "{name}");
            assert_eq!(tokens.refresh_token, want_refresh, "{name}");
            assert_eq!(tokens.email, existing.email, "{name}");
            assert_eq!(tokens.client_id, existing.client_id, "{name}");
        }
    }

    #[test]
    fn fetch_email_reads_email_and_requires_url() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("GET", "/")
            .match_header("authorization", "Bearer access")
            .with_body(r#"{"email":"me@example.com"}"#)
            .create();

        let email = fetch_email(&server.url(), "access").unwrap();
        assert_eq!(email, "me@example.com");
        mock.assert();

        assert!(
            fetch_email("", "access").is_err(),
            "fetch_email with no URL should fail"
        );
    }

    #[test]
    fn bearer_token_handles_various_states() {
        let _guard = crate::store::backend::serial();
        let now = unix_now();

        // Not signed in: nothing stored.
        let error = bearer_token().unwrap_err();
        assert!(error.to_string().contains("not signed in"), "err = {error}");

        // Unexpired access token is returned without a refresh.
        store::save_tokens(&OauthTokens {
            access_token: "access".into(),
            expiry_unix: now + 3600,
            ..Default::default()
        })
        .unwrap();
        assert_eq!(bearer_token().unwrap(), "access");

        // Expired with no refresh token to fall back on.
        store::save_tokens(&OauthTokens {
            access_token: "access".into(),
            expiry_unix: now - 1,
            ..Default::default()
        })
        .unwrap();
        let error = bearer_token().unwrap_err();
        assert!(error.to_string().contains("not signed in"), "err = {error}");

        // Corrupt store entry: deviation from Go, whose "invalid character" wording
        // is specific to encoding/json; we just assert the load fails.
        crate::store::backend::set(store::KEYRING_SERVICE, "not json").unwrap();
        assert!(bearer_token().is_err());
    }

    #[test]
    fn status_report_reads_stored_tokens_only() {
        let now = 1_000_000;
        let tokens = |access: &str, expiry_unix, refresh: &str| OauthTokens {
            access_token: access.into(),
            refresh_token: refresh.into(),
            expiry_unix,
            client_id: "c".into(),
            email: "me@example.com".into(),
        };

        let (report, signed_in) = status_report(PRODUCTION_ISSUER, None, now);
        assert!(!signed_in);
        assert!(
            report.contains("Server:        https://ruchern.dev"),
            "{report}"
        );
        assert!(
            report.contains("Signed in:     no (no tokens stored)"),
            "{report}"
        );

        let valid = tokens("access", now + 3600, "refresh");
        let (report, signed_in) = status_report(PRODUCTION_ISSUER, Some(&valid), now);
        assert!(signed_in);
        assert!(
            report.contains("Signed in:     yes as me@example.com"),
            "{report}"
        );
        assert!(report.contains("Access token:  valid until "), "{report}");
        assert!(report.contains("Refresh token: stored"), "{report}");

        // An expired access token with a refresh token renews on the next run.
        let refreshable = tokens("access", now - 1, "refresh");
        let (report, signed_in) = status_report(PRODUCTION_ISSUER, Some(&refreshable), now);
        assert!(signed_in);
        assert!(report.contains("Access token:  expired "), "{report}");

        let expired = tokens("access", now - 1, "");
        let (report, signed_in) = status_report(PRODUCTION_ISSUER, Some(&expired), now);
        assert!(!signed_in);
        assert!(
            report.contains("Signed in:     no (session expired as me@example.com)"),
            "{report}"
        );
        assert!(report.contains("Refresh token: none"), "{report}");
    }

    #[test]
    fn status_fails_when_not_signed_in() {
        let _guard = crate::store::backend::serial();
        assert_eq!(status().unwrap_err().to_string(), store::not_signed_in());

        store::save_tokens(&OauthTokens {
            access_token: "access".into(),
            expiry_unix: unix_now() + 3600,
            ..Default::default()
        })
        .unwrap();
        status().unwrap();
    }

    #[test]
    fn save_and_load_tokens_round_trip() {
        let _guard = crate::store::backend::serial();
        let want = OauthTokens {
            access_token: "a".into(),
            refresh_token: "r".into(),
            expiry_unix: 123,
            client_id: "c".into(),
            email: "e@example.com".into(),
        };
        store::save_tokens(&want).unwrap();
        let got = store::load_tokens().unwrap();
        assert_eq!(got, want);
    }

    #[test]
    fn load_tokens_without_stored_value_reports_not_signed_in() {
        let _guard = crate::store::backend::serial();
        let error = store::load_tokens().unwrap_err();
        assert_eq!(error.to_string(), store::not_signed_in());
    }
}

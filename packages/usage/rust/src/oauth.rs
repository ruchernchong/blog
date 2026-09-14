use crate::store::{self, NOT_SIGNED_IN, OauthTokens};
use anyhow::{Result, anyhow, bail};
use serde::Deserialize;
use std::time::{SystemTime, UNIX_EPOCH};

pub const OAUTH_ISSUER: &str = "https://ruchern.dev";
pub const OAUTH_RESOURCE: &str = "https://ruchern.dev/api/auth";
pub const OAUTH_SCOPES: &str = "openid profile email offline_access mcp";
pub const OAUTH_REDIRECT_URI: &str = "http://127.0.0.1:8741/callback";
pub const OAUTH_LISTEN_ADDR: &str = "127.0.0.1:8741";
pub const OAUTH_CLIENT_NAME: &str = "usage-ingest";

pub fn login() -> Result<()> {
    todo!("port login() from packages/usage/go/oauth.go")
}

pub fn logout() -> Result<()> {
    todo!("port logout() from packages/usage/go/oauth.go")
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
        bail!(NOT_SIGNED_IN);
    }
    let config = discover_oidc();
    let refreshed = refresh_tokens(&config.token_endpoint, &tokens)
        .map_err(|error| anyhow!("token refresh failed ({error:#}) — run: usage-ingest login"))?;
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
    todo!("port discoverOIDC() from packages/usage/go/oauth.go")
}

fn refresh_tokens(token_url: &str, existing: &OauthTokens) -> Result<OauthTokens> {
    let _ = (token_url, existing);
    todo!("port refreshTokens() from packages/usage/go/oauth.go")
}

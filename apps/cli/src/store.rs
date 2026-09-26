//! OAuth token persistence (login Keychain), the cached client id path, and the
//! cross-process refresh lock. Tests swap the Keychain for an in-memory store.
use anyhow::{Context, Result, anyhow};
use serde::{Deserialize, Serialize};
use std::fs::{DirBuilder, File, OpenOptions};
use std::os::unix::fs::{DirBuilderExt, OpenOptionsExt};
use std::path::PathBuf;

pub const KEYRING_SERVICE: &str = "dev.ruchern.agent-usage";
/// Service the collector used before it was renamed from usage-ingest; tokens
/// found there move to [`KEYRING_SERVICE`] on first load.
pub const LEGACY_KEYRING_SERVICE: &str = "dev.ruchern.usage-ingest";
#[cfg_attr(test, allow(dead_code))]
pub const KEYRING_ACCOUNT: &str = "oauth-tokens";
pub const NOT_SIGNED_IN: &str = "not signed in — run: agent-usage login";

/// Same JSON shape the Go collector stored, so existing Keychain items still load.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct OauthTokens {
    #[serde(default)]
    pub access_token: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub refresh_token: String,
    #[serde(default)]
    pub expiry_unix: i64,
    #[serde(default)]
    pub client_id: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub email: String,
}

pub fn save_tokens(tokens: &OauthTokens) -> Result<()> {
    backend::set(KEYRING_SERVICE, &serde_json::to_string(tokens)?)
}

pub fn load_tokens() -> Result<OauthTokens> {
    let raw = match backend::get(KEYRING_SERVICE)? {
        Some(raw) => raw,
        None => migrate_legacy_tokens()?.ok_or_else(|| anyhow!(NOT_SIGNED_IN))?,
    };
    Ok(serde_json::from_str(&raw)?)
}

/// Moves tokens saved under [`LEGACY_KEYRING_SERVICE`] to [`KEYRING_SERVICE`],
/// so the rename never forces a fresh login.
fn migrate_legacy_tokens() -> Result<Option<String>> {
    let Some(raw) = backend::get(LEGACY_KEYRING_SERVICE)? else {
        return Ok(None);
    };
    backend::set(KEYRING_SERVICE, &raw)?;
    // The tokens are already safe under the new service; a leftover legacy
    // item is never read again and logout removes it.
    let _ = backend::delete(LEGACY_KEYRING_SERVICE);
    Ok(Some(raw))
}

/// Removes the stored tokens under both services, so a legacy item cannot
/// sign the user back in; already signed out is not an error.
pub fn delete_tokens() -> Result<()> {
    backend::delete(KEYRING_SERVICE)?;
    backend::delete(LEGACY_KEYRING_SERVICE)
}

#[cfg(not(test))]
pub fn config_dir() -> PathBuf {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .unwrap_or_default()
        .join(".config/ruchern")
}

#[cfg(test)]
pub fn config_dir() -> PathBuf {
    std::env::temp_dir().join(format!("agent-usage-test-{}", std::process::id()))
}

/// Cached OAuth client id. A file left by the collector before it was renamed
/// from usage-ingest is moved here first, so the client is not registered again.
pub fn client_id_path() -> PathBuf {
    let path = config_dir().join(scoped("agent-usage-client-id"));
    if !path.exists() {
        let _ = std::fs::rename(config_dir().join(scoped("usage-ingest-client-id")), &path);
    }
    path
}

/// Production keeps the original names so existing installs stay signed in;
/// any other server (e.g. a local dev server) gets its own login.
fn scoped(name: &str) -> String {
    let issuer = crate::oauth::issuer();
    if issuer == crate::oauth::PRODUCTION_ISSUER {
        return name.to_string();
    }
    let host = issuer
        .split_once("://")
        .map_or(issuer.as_str(), |(_, host)| host);
    format!("{name}@{host}")
}

pub fn ensure_config_dir() -> Result<PathBuf> {
    let dir = config_dir();
    DirBuilder::new()
        .recursive(true)
        .mode(0o700)
        .create(&dir)
        .with_context(|| format!("create {}", dir.display()))?;
    Ok(dir)
}

/// Exclusive advisory lock shared by every agent-usage process, held until
/// dropped. Blocks until any in-flight refresh has saved its tokens.
pub struct TokenLock {
    _file: File,
}

pub fn lock_tokens() -> Result<TokenLock> {
    let path = ensure_config_dir()?.join("agent-usage.lock");
    let file = OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .mode(0o600)
        .open(&path)
        .with_context(|| format!("open {}", path.display()))?;
    file.lock()
        .with_context(|| format!("lock {}", path.display()))?;
    Ok(TokenLock { _file: file })
}

#[cfg(not(test))]
mod backend {
    use super::{KEYRING_ACCOUNT, scoped};
    use anyhow::Result;

    fn entry(service: &str) -> Result<keyring::Entry> {
        Ok(keyring::Entry::new(service, &scoped(KEYRING_ACCOUNT))?)
    }

    pub fn get(service: &str) -> Result<Option<String>> {
        match entry(service)?.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(error.into()),
        }
    }

    pub fn set(service: &str, value: &str) -> Result<()> {
        entry(service)?.set_password(value)?;
        Ok(())
    }

    pub fn delete(service: &str) -> Result<()> {
        match entry(service)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(error.into()),
        }
    }
}

/// In-memory Keychain for tests. It is process-global, so every test that
/// touches tokens must hold [`backend::serial`] for its whole body.
#[cfg(test)]
pub mod backend {
    use anyhow::{Result, bail};
    use std::collections::BTreeMap;
    use std::sync::{Mutex, MutexGuard, PoisonError};

    /// Stored value per Keychain service.
    static VALUES: Mutex<BTreeMap<String, String>> = Mutex::new(BTreeMap::new());
    static FAILURE: Mutex<Option<String>> = Mutex::new(None);
    static SERIAL: Mutex<()> = Mutex::new(());

    /// Serialises token tests and resets the store to empty and working.
    pub fn serial() -> MutexGuard<'static, ()> {
        let guard = SERIAL.lock().unwrap_or_else(PoisonError::into_inner);
        VALUES
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .clear();
        *FAILURE.lock().unwrap_or_else(PoisonError::into_inner) = None;
        guard
    }

    /// Makes every store call fail, e.g. to prove a path never touches the Keychain.
    pub fn fail_with(message: &str) {
        *FAILURE.lock().unwrap_or_else(PoisonError::into_inner) = Some(message.to_string());
    }

    fn check() -> Result<()> {
        if let Some(message) = FAILURE
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .clone()
        {
            bail!(message);
        }
        Ok(())
    }

    fn values() -> MutexGuard<'static, BTreeMap<String, String>> {
        VALUES.lock().unwrap_or_else(PoisonError::into_inner)
    }

    pub fn get(service: &str) -> Result<Option<String>> {
        check()?;
        Ok(values().get(service).cloned())
    }

    pub fn set(service: &str, value: &str) -> Result<()> {
        check()?;
        values().insert(service.to_string(), value.to_string());
        Ok(())
    }

    pub fn delete(service: &str) -> Result<()> {
        check()?;
        values().remove(service);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::{
        KEYRING_SERVICE, LEGACY_KEYRING_SERVICE, NOT_SIGNED_IN, OauthTokens, backend,
        client_id_path, config_dir, delete_tokens, ensure_config_dir, load_tokens, save_tokens,
    };

    fn tokens(access_token: &str) -> OauthTokens {
        OauthTokens {
            access_token: access_token.into(),
            refresh_token: "r".into(),
            expiry_unix: 123,
            client_id: "c".into(),
            email: "e@example.com".into(),
        }
    }

    #[test]
    fn load_tokens_migrates_legacy_keychain_item() {
        let _guard = backend::serial();
        let want = tokens("legacy");
        backend::set(
            LEGACY_KEYRING_SERVICE,
            &serde_json::to_string(&want).unwrap(),
        )
        .unwrap();

        assert_eq!(load_tokens().unwrap(), want);
        let moved = backend::get(KEYRING_SERVICE)
            .unwrap()
            .expect("saved under new service");
        assert_eq!(serde_json::from_str::<OauthTokens>(&moved).unwrap(), want);
        assert_eq!(backend::get(LEGACY_KEYRING_SERVICE).unwrap(), None);

        // Later loads read the new service directly.
        assert_eq!(load_tokens().unwrap(), want);
    }

    #[test]
    fn load_tokens_prefers_new_keychain_item_over_legacy() {
        let _guard = backend::serial();
        save_tokens(&tokens("new")).unwrap();
        let legacy = serde_json::to_string(&tokens("legacy")).unwrap();
        backend::set(LEGACY_KEYRING_SERVICE, &legacy).unwrap();

        assert_eq!(load_tokens().unwrap().access_token, "new");
        assert_eq!(backend::get(LEGACY_KEYRING_SERVICE).unwrap(), Some(legacy));
    }

    #[test]
    fn delete_tokens_removes_new_and_legacy_items() {
        let _guard = backend::serial();
        save_tokens(&tokens("new")).unwrap();
        let legacy = serde_json::to_string(&tokens("legacy")).unwrap();
        backend::set(LEGACY_KEYRING_SERVICE, &legacy).unwrap();

        delete_tokens().unwrap();
        assert_eq!(backend::get(KEYRING_SERVICE).unwrap(), None);
        assert_eq!(backend::get(LEGACY_KEYRING_SERVICE).unwrap(), None);
        assert_eq!(load_tokens().unwrap_err().to_string(), NOT_SIGNED_IN);
    }

    #[test]
    fn client_id_path_migrates_legacy_file() {
        let dir = ensure_config_dir().unwrap();
        let legacy = config_dir().join("usage-ingest-client-id");
        let current = dir.join("agent-usage-client-id");
        let _ = std::fs::remove_file(&current);

        // Legacy only: moved to the new name.
        std::fs::write(&legacy, "legacy-client\n").unwrap();
        assert_eq!(client_id_path(), current);
        assert_eq!(
            std::fs::read_to_string(&current).unwrap(),
            "legacy-client\n"
        );
        assert!(!legacy.exists());

        // Both present: the new file wins and the legacy one is left alone.
        std::fs::write(&legacy, "stale-client\n").unwrap();
        assert_eq!(client_id_path(), current);
        assert_eq!(
            std::fs::read_to_string(&current).unwrap(),
            "legacy-client\n"
        );
        assert!(legacy.exists());

        let _ = std::fs::remove_file(&legacy);
        let _ = std::fs::remove_file(&current);
    }
}

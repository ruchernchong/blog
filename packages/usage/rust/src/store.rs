//! OAuth token persistence (login Keychain), the cached client id path, and the
//! cross-process refresh lock. Tests swap the Keychain for an in-memory store.
use anyhow::{Context, Result, anyhow};
use serde::{Deserialize, Serialize};
use std::fs::{DirBuilder, File, OpenOptions};
use std::os::unix::fs::{DirBuilderExt, OpenOptionsExt};
use std::path::PathBuf;

pub const KEYRING_SERVICE: &str = "dev.ruchern.usage-ingest";
pub const KEYRING_ACCOUNT: &str = "oauth-tokens";
pub const NOT_SIGNED_IN: &str = "not signed in — run: usage-ingest login";

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
    backend::set(&serde_json::to_string(tokens)?)
}

pub fn load_tokens() -> Result<OauthTokens> {
    let Some(raw) = backend::get()? else {
        return Err(anyhow!(NOT_SIGNED_IN));
    };
    Ok(serde_json::from_str(&raw)?)
}

/// Removes the stored tokens; already signed out is not an error.
pub fn delete_tokens() -> Result<()> {
    backend::delete()
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
    std::env::temp_dir().join(format!("usage-ingest-test-{}", std::process::id()))
}

pub fn client_id_path() -> PathBuf {
    config_dir().join("usage-ingest-client-id")
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

/// Exclusive advisory lock shared by every usage-ingest process, held until
/// dropped. Blocks until any in-flight refresh has saved its tokens.
pub struct TokenLock {
    _file: File,
}

pub fn lock_tokens() -> Result<TokenLock> {
    let path = ensure_config_dir()?.join("usage-ingest.lock");
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
    use super::{KEYRING_ACCOUNT, KEYRING_SERVICE};
    use anyhow::Result;

    fn entry() -> Result<keyring::Entry> {
        Ok(keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)?)
    }

    pub fn get() -> Result<Option<String>> {
        match entry()?.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(error.into()),
        }
    }

    pub fn set(value: &str) -> Result<()> {
        entry()?.set_password(value)?;
        Ok(())
    }

    pub fn delete() -> Result<()> {
        match entry()?.delete_credential() {
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
    use std::sync::{Mutex, MutexGuard, PoisonError};

    static VALUE: Mutex<Option<String>> = Mutex::new(None);
    static FAILURE: Mutex<Option<String>> = Mutex::new(None);
    static SERIAL: Mutex<()> = Mutex::new(());

    /// Serialises token tests and resets the store to empty and working.
    pub fn serial() -> MutexGuard<'static, ()> {
        let guard = SERIAL.lock().unwrap_or_else(PoisonError::into_inner);
        *VALUE.lock().unwrap_or_else(PoisonError::into_inner) = None;
        *FAILURE.lock().unwrap_or_else(PoisonError::into_inner) = None;
        guard
    }

    /// Makes every store call fail, e.g. to prove a path never touches the Keychain.
    pub fn fail_with(message: &str) {
        *FAILURE.lock().unwrap_or_else(PoisonError::into_inner) = Some(message.to_string());
    }

    fn check() -> Result<()> {
        if let Some(message) = FAILURE.lock().unwrap_or_else(PoisonError::into_inner).clone() {
            bail!(message);
        }
        Ok(())
    }

    pub fn get() -> Result<Option<String>> {
        check()?;
        Ok(VALUE.lock().unwrap_or_else(PoisonError::into_inner).clone())
    }

    pub fn set(value: &str) -> Result<()> {
        check()?;
        *VALUE.lock().unwrap_or_else(PoisonError::into_inner) = Some(value.to_string());
        Ok(())
    }

    pub fn delete() -> Result<()> {
        check()?;
        *VALUE.lock().unwrap_or_else(PoisonError::into_inner) = None;
        Ok(())
    }
}

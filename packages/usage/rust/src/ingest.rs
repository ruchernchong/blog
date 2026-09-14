use crate::collect::CollectResult;
use anyhow::Result;

/// POST daily rows to `/api/usage/ingest` (OAuth bearer; the server prices them).
/// Port of `packages/usage/go/ingest.go`.
pub fn ingest(result: &CollectResult) -> Result<()> {
    let _ = result;
    todo!("port packages/usage/go/ingest.go")
}

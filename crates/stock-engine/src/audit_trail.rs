//! Immutable Inventory Audit Trail Logger

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuditEntry {
    pub timestamp_epoch_sec: u64,
    pub user_id: String,
    pub action: String,
    pub item_id: String,
    pub qty_delta: i64,
}

impl AuditEntry {
    pub fn record(user_id: &str, action: &str, item_id: &str, qty_delta: i64) -> Self {
        Self {
            timestamp_epoch_sec: 1700000000,
            user_id: user_id.to_string(),
            action: action.to_string(),
            item_id: item_id.to_string(),
            qty_delta,
        }
    }
}

//! Batch Expiration Tracker & Spoilage Prevention Engine
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ExpiringBatch {
    pub batch_id: String,
    pub ingredient_id: String,
    pub expiry_timestamp: u64,
    pub quantity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExpiryAlertLevel {
    Expired,
    CriticalNearExpiry,
    Normal,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ExpiryReportItem {
    pub batch: ExpiringBatch,
    pub status: ExpiryAlertLevel,
    pub hours_until_expiry: f64,
}

pub fn filter_near_expiry(batches: &[ExpiringBatch], current_time: u64, threshold_sec: u64) -> Vec<&ExpiringBatch> {
    batches
        .iter()
        .filter(|b| b.quantity > 0.0 && b.expiry_timestamp > current_time && b.expiry_timestamp <= current_time + threshold_sec)
        .collect()
}

pub fn filter_already_expired(batches: &[ExpiringBatch], current_time: u64) -> Vec<&ExpiringBatch> {
    batches
        .iter()
        .filter(|b| b.quantity > 0.0 && b.expiry_timestamp <= current_time)
        .collect()
}

pub fn generate_expiry_audit_report(
    batches: &[ExpiringBatch],
    current_time: u64,
    critical_threshold_sec: u64,
) -> Vec<ExpiryReportItem> {
    batches
        .iter()
        .filter(|b| b.quantity > 0.0)
        .map(|b| {
            let (status, hours_left) = if b.expiry_timestamp <= current_time {
                (ExpiryAlertLevel::Expired, 0.0)
            } else if b.expiry_timestamp <= current_time + critical_threshold_sec {
                let diff_sec = b.expiry_timestamp - current_time;
                (ExpiryAlertLevel::CriticalNearExpiry, (diff_sec as f64) / 3600.0)
            } else {
                let diff_sec = b.expiry_timestamp - current_time;
                (ExpiryAlertLevel::Normal, (diff_sec as f64) / 3600.0)
            };

            ExpiryReportItem {
                batch: b.clone(),
                status,
                hours_until_expiry: (hours_left * 100.0).round() / 100.0,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_near_expiry_detection() {
        let batches = vec![
            ExpiringBatch { batch_id: "B1".into(), ingredient_id: "MILK".into(), expiry_timestamp: 1000, quantity: 10.0 },
            ExpiringBatch { batch_id: "B2".into(), ingredient_id: "BEEF".into(), expiry_timestamp: 5000, quantity: 5.0 },
            ExpiringBatch { batch_id: "B3".into(), ingredient_id: "CREAM".into(), expiry_timestamp: 800, quantity: 0.0 }, // zero qty ignored
        ];
        let near = filter_near_expiry(&batches, 900, 200);
        assert_eq!(near.len(), 1);
        assert_eq!(near[0].batch_id, "B1");
    }

    #[test]
    fn test_already_expired_detection() {
        let batches = vec![
            ExpiringBatch { batch_id: "B_OLD".into(), ingredient_id: "FISH".into(), expiry_timestamp: 500, quantity: 4.0 },
            ExpiringBatch { batch_id: "B_FRESH".into(), ingredient_id: "FISH".into(), expiry_timestamp: 2000, quantity: 8.0 },
        ];
        let expired = filter_already_expired(&batches, 1000);
        assert_eq!(expired.len(), 1);
        assert_eq!(expired[0].batch_id, "B_OLD");
    }

    #[test]
    fn test_expiry_audit_report() {
        let batches = vec![
            ExpiringBatch { batch_id: "B1".into(), ingredient_id: "YOGURT".into(), expiry_timestamp: 1000, quantity: 5.0 },
            ExpiringBatch { batch_id: "B2".into(), ingredient_id: "PASTA".into(), expiry_timestamp: 86400 * 30, quantity: 50.0 },
        ];
        let report = generate_expiry_audit_report(&batches, 500, 1000);
        assert_eq!(report.len(), 2);
        assert_eq!(report[0].status, ExpiryAlertLevel::CriticalNearExpiry);
        assert_eq!(report[1].status, ExpiryAlertLevel::Normal);
    }
}

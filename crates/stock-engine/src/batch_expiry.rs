//! Batch Expiration Tracker
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpiringBatch {
    pub batch_id: String,
    pub ingredient_id: String,
    pub expiry_timestamp: u64,
    pub quantity: f64,
}

pub fn filter_near_expiry(batches: &[ExpiringBatch], current_time: u64, threshold_sec: u64) -> Vec<&ExpiringBatch> {
    batches.iter().filter(|b| b.expiry_timestamp <= current_time + threshold_sec).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_near_expiry_detection() {
        let batches = vec![
            ExpiringBatch { batch_id: "B1".into(), ingredient_id: "MILK".into(), expiry_timestamp: 1000, quantity: 10.0 },
            ExpiringBatch { batch_id: "B2".into(), ingredient_id: "BEEF".into(), expiry_timestamp: 5000, quantity: 5.0 },
        ];
        let near = filter_near_expiry(&batches, 900, 200);
        assert_eq!(near.len(), 1);
        assert_eq!(near[0].batch_id, "B1");
    }
}

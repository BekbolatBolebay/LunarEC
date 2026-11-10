use stock_engine::fifo_lifo::{InventoryLedger, StockBatch, ValuationMethod};
use stock_engine::batch_expiry::{
    ExpiringBatch, ExpiryAlertLevel, filter_already_expired, filter_near_expiry, generate_expiry_audit_report,
};

#[test]
fn test_qa_fifo_stress_deduction_and_zero_drift() {
    let mut ledger = InventoryLedger::new(ValuationMethod::FIFO);

    // 100 партия қабылдау (әрқайсысы 10 дана, өсіп отыратын бағамен)
    for i in 1..=100 {
        ledger.receive_batch(StockBatch {
            batch_id: format!("BATCH-KZ-{:03}", i),
            item_sku: "SKU-ALMATY-FLOUR-1KG".to_string(),
            quantity: 10.0,
            unit_purchase_price: 300.0 + (i as f64 * 2.0),
            received_date: "2026-10-10".to_string(),
            expiry_date: Some("2027-10-10".to_string()),
        });
    }

    assert_eq!(ledger.total_on_hand(), 1000.0);

    // 250 дананы алып тастау (25 партия толық өшірілуі керек)
    let deduction = ledger.deduct_stock(250.0);
    assert_eq!(deduction.fulfilled_qty, 250.0);
    assert_eq!(ledger.total_on_hand(), 750.0);
    assert_eq!(deduction.batches_used.len(), 25);

    // Қалған қор тексерісі
    let remaining_deduction = ledger.deduct_stock(750.0);
    assert_eq!(remaining_deduction.fulfilled_qty, 750.0);
    assert_eq!(ledger.total_on_hand(), 0.0);

    // Қоймада ештеңе қалмағанда сұраныс нөлді қайтаруы тиіс
    let zero_deduction = ledger.deduct_stock(10.0);
    assert_eq!(zero_deduction.fulfilled_qty, 0.0);
}

#[test]
fn test_qa_batch_expiry_fefo_detection() {
    let current_time: u64 = 1_760_000_000;
    let threshold_24h: u64 = 86_400;

    let batches = vec![
        ExpiringBatch {
            batch_id: "B-EXPIRED".to_string(),
            ingredient_id: "ING-MILK".to_string(),
            expiry_timestamp: current_time - 3600, // 1 сағат бұрын мерзімі өткен
            quantity: 50.0,
        },
        ExpiringBatch {
            batch_id: "B-NEAR".to_string(),
            ingredient_id: "ING-MILK".to_string(),
            expiry_timestamp: current_time + 10_000, // 24 сағаттың ішінде
            quantity: 30.0,
        },
        ExpiringBatch {
            batch_id: "B-SAFE".to_string(),
            ingredient_id: "ING-MILK".to_string(),
            expiry_timestamp: current_time + 500_000, // Қауіпсіз
            quantity: 100.0,
        },
    ];

    let expired = filter_already_expired(&batches, current_time);
    assert_eq!(expired.len(), 1);
    assert_eq!(expired[0].batch_id, "B-EXPIRED");

    let near = filter_near_expiry(&batches, current_time, threshold_24h);
    assert_eq!(near.len(), 1);
    assert_eq!(near[0].batch_id, "B-NEAR");

    let report = generate_expiry_audit_report(&batches, current_time, threshold_24h);
    assert_eq!(report.len(), 3);
    assert_eq!(report[0].status, ExpiryAlertLevel::Expired);
    assert_eq!(report[1].status, ExpiryAlertLevel::CriticalNearExpiry);
    assert_eq!(report[2].status, ExpiryAlertLevel::Normal);
}

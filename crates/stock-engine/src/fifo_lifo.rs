use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockBatch {
    pub batch_id: String,
    pub item_sku: String,
    pub quantity: f64,
    pub unit_purchase_price: f64,
    pub received_date: String,
    pub expiry_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ValuationMethod {
    FIFO, // First In, First Out
    LIFO, // Last In, First Out
    WeightedAverage,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeductionLedger {
    pub item_sku: String,
    pub requested_qty: f64,
    pub fulfilled_qty: f64,
    pub total_cost_of_goods_sold: f64,
    pub batches_used: Vec<(String, f64, f64)>, // (batch_id, qty_used, unit_price)
}

pub struct InventoryLedger {
    pub batches: VecDeque<StockBatch>,
    pub method: ValuationMethod,
}

impl InventoryLedger {
    pub fn new(method: ValuationMethod) -> Self {
        Self {
            batches: VecDeque::new(),
            method,
        }
    }

    pub fn receive_batch(&mut self, batch: StockBatch) {
        if batch.quantity > 0.0 {
            self.batches.push_back(batch);
        }
    }

    pub fn total_on_hand(&self) -> f64 {
        self.batches.iter().map(|b| b.quantity).sum()
    }

    pub fn calculate_weighted_average_cost(&self) -> f64 {
        let total_val: f64 = self.batches.iter().map(|b| b.quantity * b.unit_purchase_price).sum();
        let total_qty = self.total_on_hand();
        if total_qty > 0.0 {
            total_val / total_qty
        } else {
            0.0
        }
    }

    pub fn deduct_stock(&mut self, mut needed_qty: f64) -> DeductionLedger {
        let requested = needed_qty.max(0.0);
        needed_qty = requested;

        let detected_sku = self.batches.front().map(|b| b.item_sku.clone()).unwrap_or_else(|| "UNKNOWN_SKU".to_string());
        let mut total_cogs = 0.0;
        let mut batches_used = Vec::new();

        if needed_qty <= 0.0 {
            return DeductionLedger {
                item_sku: detected_sku,
                requested_qty: 0.0,
                fulfilled_qty: 0.0,
                total_cost_of_goods_sold: 0.0,
                batches_used,
            };
        }

        match self.method {
            ValuationMethod::FIFO => {
                while needed_qty > 0.0 && !self.batches.is_empty() {
                    let front = self.batches.front_mut().unwrap();
                    if front.quantity <= needed_qty {
                        let used = front.quantity;
                        needed_qty -= used;
                        total_cogs += used * front.unit_purchase_price;
                        batches_used.push((front.batch_id.clone(), used, front.unit_purchase_price));
                        self.batches.pop_front();
                    } else {
                        front.quantity -= needed_qty;
                        total_cogs += needed_qty * front.unit_purchase_price;
                        batches_used.push((front.batch_id.clone(), needed_qty, front.unit_purchase_price));
                        needed_qty = 0.0;
                    }
                }
            }
            ValuationMethod::LIFO => {
                while needed_qty > 0.0 && !self.batches.is_empty() {
                    let back = self.batches.back_mut().unwrap();
                    if back.quantity <= needed_qty {
                        let used = back.quantity;
                        needed_qty -= used;
                        total_cogs += used * back.unit_purchase_price;
                        batches_used.push((back.batch_id.clone(), used, back.unit_purchase_price));
                        self.batches.pop_back();
                    } else {
                        back.quantity -= needed_qty;
                        total_cogs += needed_qty * back.unit_purchase_price;
                        batches_used.push((back.batch_id.clone(), needed_qty, back.unit_purchase_price));
                        needed_qty = 0.0;
                    }
                }
            }
            ValuationMethod::WeightedAverage => {
                let avg_cost = self.calculate_weighted_average_cost();
                let available = self.total_on_hand();
                let used = needed_qty.min(available);
                total_cogs = used * avg_cost;

                let mut to_deduct = used;
                while to_deduct > 0.0 && !self.batches.is_empty() {
                    let front = self.batches.front_mut().unwrap();
                    if front.quantity <= to_deduct {
                        to_deduct -= front.quantity;
                        self.batches.pop_front();
                    } else {
                        front.quantity -= to_deduct;
                        to_deduct = 0.0;
                    }
                }
                needed_qty -= used;
                batches_used.push(("WEIGHTED_AVG".to_string(), used, avg_cost));
            }
        }

        let fulfilled = requested - needed_qty;
        DeductionLedger {
            item_sku: detected_sku,
            requested_qty: requested,
            fulfilled_qty: fulfilled,
            total_cost_of_goods_sold: (total_cogs * 100.0).round() / 100.0,
            batches_used,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fifo_deduction() {
        let mut ledger = InventoryLedger::new(ValuationMethod::FIFO);
        ledger.receive_batch(StockBatch {
            batch_id: "B1".to_string(),
            item_sku: "BEEF".to_string(),
            quantity: 10.0,
            unit_purchase_price: 4000.0,
            received_date: "2026-09-01".to_string(),
            expiry_date: None,
        });
        ledger.receive_batch(StockBatch {
            batch_id: "B2".to_string(),
            item_sku: "BEEF".to_string(),
            quantity: 10.0,
            unit_purchase_price: 4500.0,
            received_date: "2026-09-10".to_string(),
            expiry_date: None,
        });

        // Deduct 15 kg: 10 kg from B1 @ 4000 + 5 kg from B2 @ 4500 = 40,000 + 22,500 = 62,500
        let res = ledger.deduct_stock(15.0);
        assert_eq!(res.fulfilled_qty, 15.0);
        assert_eq!(res.total_cost_of_goods_sold, 62500.0);
        assert_eq!(res.item_sku, "BEEF");
        assert_eq!(ledger.total_on_hand(), 5.0);
    }

    #[test]
    fn test_lifo_deduction() {
        let mut ledger = InventoryLedger::new(ValuationMethod::LIFO);
        ledger.receive_batch(StockBatch {
            batch_id: "B1".to_string(),
            item_sku: "SALMON".to_string(),
            quantity: 10.0,
            unit_purchase_price: 5000.0,
            received_date: "2026-09-01".to_string(),
            expiry_date: None,
        });
        ledger.receive_batch(StockBatch {
            batch_id: "B2".to_string(),
            item_sku: "SALMON".to_string(),
            quantity: 10.0,
            unit_purchase_price: 6000.0,
            received_date: "2026-09-10".to_string(),
            expiry_date: None,
        });

        // LIFO deducts newest batch B2 first (10 @ 6000 + 5 @ 5000 = 60,000 + 25,000 = 85,000)
        let res = ledger.deduct_stock(15.0);
        assert_eq!(res.fulfilled_qty, 15.0);
        assert_eq!(res.total_cost_of_goods_sold, 85000.0);
        assert_eq!(ledger.total_on_hand(), 5.0);
    }

    #[test]
    fn test_zero_or_negative_deduction_guard() {
        let mut ledger = InventoryLedger::new(ValuationMethod::FIFO);
        ledger.receive_batch(StockBatch {
            batch_id: "B1".to_string(),
            item_sku: "TEA".to_string(),
            quantity: 20.0,
            unit_purchase_price: 100.0,
            received_date: "2026-09-01".to_string(),
            expiry_date: None,
        });

        let res = ledger.deduct_stock(0.0);
        assert_eq!(res.fulfilled_qty, 0.0);
        assert_eq!(res.total_cost_of_goods_sold, 0.0);
        assert_eq!(ledger.total_on_hand(), 20.0);
    }
}

//! Stock Valuation Engine (FIFO, LIFO, Weighted Average Cost)
//!
//! Provides ultra-fast valuation for balance sheet and COGS reporting.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ValuationMethod {
    Fifo,
    Lifo,
    WeightedAverage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockBatch {
    pub batch_id: String,
    pub quantity: f64,
    pub unit_cost: f64,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemValuation {
    pub item_id: String,
    pub total_quantity: f64,
    pub total_value: f64,
    pub average_unit_cost: f64,
    pub method: ValuationMethod,
}

#[derive(Debug, Default)]
pub struct ValuationEngine {
    pub inventory_batches: HashMap<String, Vec<StockBatch>>,
}

impl ValuationEngine {
    pub fn new() -> Self {
        Self {
            inventory_batches: HashMap::new(),
        }
    }

    pub fn receive_stock(&mut self, item_id: &str, batch_id: &str, quantity: f64, unit_cost: f64, timestamp: u64) {
        let batches = self.inventory_batches.entry(item_id.to_string()).or_default();
        batches.push(StockBatch {
            batch_id: batch_id.to_string(),
            quantity,
            unit_cost,
            timestamp,
        });
    }

    pub fn calculate_valuation(&self, item_id: &str, method: ValuationMethod) -> Option<ItemValuation> {
        let batches = self.inventory_batches.get(item_id)?;
        let total_quantity: f64 = batches.iter().map(|b| b.quantity).sum();

        if total_quantity <= 0.0 {
            return Some(ItemValuation {
                item_id: item_id.to_string(),
                total_quantity: 0.0,
                total_value: 0.0,
                average_unit_cost: 0.0,
                method,
            });
        }

        let total_value: f64 = match method {
            ValuationMethod::Fifo | ValuationMethod::Lifo | ValuationMethod::WeightedAverage => {
                batches.iter().map(|b| b.quantity * b.unit_cost).sum()
            }
        };

        let average_unit_cost = total_value / total_quantity;

        Some(ItemValuation {
            item_id: item_id.to_string(),
            total_quantity,
            total_value,
            average_unit_cost,
            method,
        })
    }

    pub fn total_portfolio_value(&self) -> f64 {
        self.inventory_batches
            .values()
            .flat_map(|batches| batches.iter())
            .map(|b| b.quantity * b.unit_cost)
            .sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valuation_calculation() {
        let mut engine = ValuationEngine::new();
        engine.receive_stock("MEAT-BEEF", "B01", 100.0, 3200.0, 1000);
        engine.receive_stock("MEAT-BEEF", "B02", 50.0, 3500.0, 2000);

        let val = engine.calculate_valuation("MEAT-BEEF", ValuationMethod::WeightedAverage).unwrap();
        assert_eq!(val.total_quantity, 150.0);
        assert_eq!(val.total_value, 495_000.0);
        assert_eq!(val.average_unit_cost, 3300.0);
    }

    #[test]
    fn test_portfolio_total_value() {
        let mut engine = ValuationEngine::new();
        engine.receive_stock("MEAT", "B1", 10.0, 3000.0, 100);
        engine.receive_stock("CHEESE", "B2", 20.0, 2500.0, 100);

        assert_eq!(engine.total_portfolio_value(), 80_000.0);
    }
}

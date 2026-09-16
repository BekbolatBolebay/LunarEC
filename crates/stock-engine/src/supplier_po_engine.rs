use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierRating {
    pub supplier_id: String,
    pub name: String,
    pub on_time_delivery_rate: f64, // 0.0 - 1.0
    pub quality_score: f64,          // 0.0 - 5.0
    pub payment_terms_days: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct POLineItem {
    pub sku: String,
    pub name: String,
    pub ordered_qty: f64,
    pub received_qty: f64,
    pub unit_price: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComprehensivePurchaseOrder {
    pub po_number: String,
    pub supplier: SupplierRating,
    pub lines: Vec<POLineItem>,
    pub tax_rate_percent: f64,
    pub is_fulfilled: bool,
}

impl ComprehensivePurchaseOrder {
    pub fn calculate_subtotal(&self) -> f64 {
        self.lines.iter().map(|l| l.ordered_qty * l.unit_price).sum()
    }

    pub fn calculate_tax_amount(&self) -> f64 {
        self.calculate_subtotal() * (self.tax_rate_percent / 100.0)
    }

    pub fn calculate_grand_total(&self) -> f64 {
        self.calculate_subtotal() + self.calculate_tax_amount()
    }

    pub fn receive_goods(&mut self, sku: &str, qty: f64) -> Result<(), String> {
        if let Some(line) = self.lines.iter_mut().find(|l| l.sku == sku) {
            line.received_qty += qty;
            self.check_fulfillment();
            Ok(())
        } else {
            Err("Аталған PO құжатында бұл тауар жоқ".to_string())
        }
    }

    fn check_fulfillment(&mut self) {
        self.is_fulfilled = self.lines.iter().all(|l| l.received_qty >= l.ordered_qty);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_po_totals_and_receiving() {
        let mut po = ComprehensivePurchaseOrder {
            po_number: "PO-900".to_string(),
            supplier: SupplierRating {
                supplier_id: "S1".to_string(),
                name: "KazBeef".to_string(),
                on_time_delivery_rate: 0.98,
                quality_score: 4.9,
                payment_terms_days: 14,
            },
            lines: vec![
                POLineItem {
                    sku: "BEEF".to_string(),
                    name: "Сиыр еті".to_string(),
                    ordered_qty: 50.0,
                    received_qty: 0.0,
                    unit_price: 4000.0,
                },
            ],
            tax_rate_percent: 12.0, // ҚҚС 12%
            is_fulfilled: false,
        };

        assert_eq!(po.calculate_subtotal(), 200000.0);
        assert_eq!(po.calculate_grand_total(), 224000.0);

        po.receive_goods("BEEF", 50.0).unwrap();
        assert!(po.is_fulfilled);
    }
}

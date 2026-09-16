use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditDiscrepancy {
    pub sku: String,
    pub item_name: String,
    pub book_quantity: f64,    // Бухгалтерлік есептегі қалдық
    pub counted_quantity: f64, // Нақты инвентаризациядағы қалдық
    pub variance: f64,
    pub unit_cost: f64,
    pub financial_impact: f64, // variance * unit_cost
    pub discrepancy_type: DiscrepancyType,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum DiscrepancyType {
    Shortage, // Кем шығу (ұрлық немесе бүліну)
    Surplus,  // Артық шығу (есепке алынбаған кіріс)
    Balanced, // Сәйкес
}

pub struct InventoryAuditor;

impl InventoryAuditor {
    pub fn perform_reconciliation(
        sku: &str,
        name: &str,
        book_qty: f64,
        counted_qty: f64,
        unit_cost: f64,
    ) -> AuditDiscrepancy {
        let variance = counted_qty - book_qty;
        let financial_impact = variance * unit_cost;

        let discrepancy_type = if variance < -0.001 {
            DiscrepancyType::Shortage
        } else if variance > 0.001 {
            DiscrepancyType::Surplus
        } else {
            DiscrepancyType::Balanced
        };

        AuditDiscrepancy {
            sku: sku.to_string(),
            item_name: name.to_string(),
            book_quantity: book_qty,
            counted_quantity: counted_qty,
            variance,
            unit_cost,
            financial_impact,
            discrepancy_type,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audit_shortage_calculation() {
        let disc = InventoryAuditor::perform_reconciliation("CHEESE", "Чеддер", 10.0, 8.5, 3000.0);
        assert_eq!(disc.discrepancy_type, DiscrepancyType::Shortage);
        assert_eq!(disc.variance, -1.5);
        assert_eq!(disc.financial_impact, -4500.0);
    }
}

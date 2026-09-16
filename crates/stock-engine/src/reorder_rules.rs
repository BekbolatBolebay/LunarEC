use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReorderRule {
    pub item_sku: String,
    pub item_name: String,
    pub min_safety_stock: f64,
    pub max_target_stock: f64,
    pub average_daily_consumption: f64,
    pub lead_time_days: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseSuggestion {
    pub item_sku: String,
    pub item_name: String,
    pub current_stock: f64,
    pub suggested_order_qty: f64,
    pub urgent: bool,
    pub reason: String,
}

pub fn evaluate_reorder(rule: &ReorderRule, current_stock: f64) -> Option<PurchaseSuggestion> {
    // Lead time consumption buffer
    let lead_time_consumption = rule.average_daily_consumption * (rule.lead_time_days as f64);
    let reorder_point = rule.min_safety_stock + lead_time_consumption;

    if current_stock <= reorder_point {
        let order_qty = rule.max_target_stock - current_stock;
        let urgent = current_stock <= rule.min_safety_stock;

        Some(PurchaseSuggestion {
            item_sku: rule.item_sku.clone(),
            item_name: rule.item_name.clone(),
            current_stock,
            suggested_order_qty: if order_qty > 0.0 { order_qty } else { rule.min_safety_stock },
            urgent,
            reason: if urgent {
                "Қалдық критикалық қауіпсіздік шегінен төмен түсті!".to_string()
            } else {
                "Қайта тапсырыс беру деңгейіне (ROP) жетті.".to_string()
            },
        })
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reorder_rule_trigger() {
        let rule = ReorderRule {
            item_sku: "COFFEE-01".to_string(),
            item_name: "Arabica Espresso".to_string(),
            min_safety_stock: 5.0,
            max_target_stock: 30.0,
            average_daily_consumption: 2.0,
            lead_time_days: 3, // ROP = 5 + (2 * 3) = 11 kg
        };

        // Stock = 10 kg (below 11 kg -> trigger reorder)
        let suggestion = evaluate_reorder(&rule, 10.0);
        assert!(suggestion.is_some());
        let s = suggestion.unwrap();
        assert_eq!(s.suggested_order_qty, 20.0);
        assert!(!s.urgent);

        // Stock = 3 kg (below min safety 5 kg -> urgent!)
        let urgent_sugg = evaluate_reorder(&rule, 3.0).unwrap();
        assert!(urgent_sugg.urgent);
    }
}

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

use crate::supplier_po_engine::{ComprehensivePurchaseOrder, POLineItem, SupplierRating};
use std::collections::HashMap;

/// Жеткізуші мен тауар байланысы каталогы
#[derive(Debug, Clone)]
pub struct SupplierCatalogItem {
    pub supplier: SupplierRating,
    pub unit_price_kzt: f64,
}

pub struct AutoReorderAggregator;

impl AutoReorderAggregator {
    /// Қоймадағы тауарлар қалдығын тексеріп, әр жеткізушіге бөлек ресми Purchase Order құжаттарын қалыптастырады
    pub fn generate_purchase_orders(
        rules: &[ReorderRule],
        current_stocks: &HashMap<String, f64>,
        catalog: &HashMap<String, SupplierCatalogItem>,
    ) -> Vec<ComprehensivePurchaseOrder> {
        let mut supplier_orders: HashMap<String, (SupplierRating, Vec<POLineItem>)> = HashMap::new();

        for rule in rules {
            let stock = current_stocks.get(&rule.item_sku).copied().unwrap_or(0.0);
            if let Some(suggestion) = evaluate_reorder(rule, stock) {
                if let Some(cat_item) = catalog.get(&rule.item_sku) {
                    let entry = supplier_orders.entry(cat_item.supplier.supplier_id.clone()).or_insert_with(|| {
                        (cat_item.supplier.clone(), Vec::new())
                    });

                    entry.1.push(POLineItem {
                        sku: suggestion.item_sku,
                        name: suggestion.item_name,
                        ordered_qty: suggestion.suggested_order_qty,
                        received_qty: 0.0,
                        unit_price: cat_item.unit_price_kzt,
                    });
                }
            }
        }

        let mut po_list = Vec::new();
        let mut counter = 1;
        for (_, (supplier, lines)) in supplier_orders {
            if !lines.is_empty() {
                po_list.push(ComprehensivePurchaseOrder {
                    po_number: format!("PO-AUTO-{:04}", counter),
                    supplier,
                    lines,
                    tax_rate_percent: 12.0, // Қазақстан ҚҚС мөлшерлемесі
                    is_fulfilled: false,
                });
                counter += 1;
            }
        }

        po_list
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

    #[test]
    fn test_auto_reorder_aggregator_generates_po() {
        let rules = vec![
            ReorderRule {
                item_sku: "MILK-01".to_string(),
                item_name: "Сүт 3.2% ФудМастер".to_string(),
                min_safety_stock: 10.0,
                max_target_stock: 60.0,
                average_daily_consumption: 15.0,
                lead_time_days: 2, // ROP = 10 + 30 = 40 л
            },
            ReorderRule {
                item_sku: "SUGAR-01".to_string(),
                item_name: "Ақ қант".to_string(),
                min_safety_stock: 20.0,
                max_target_stock: 100.0,
                average_daily_consumption: 5.0,
                lead_time_days: 4, // ROP = 20 + 20 = 40 кг
            },
        ];

        let mut stocks = HashMap::new();
        stocks.insert("MILK-01".to_string(), 15.0); // <= 40 -> reorder (60 - 15 = 45 л)
        stocks.insert("SUGAR-01".to_string(), 60.0); // > 40 -> no reorder

        let mut catalog = HashMap::new();
        catalog.insert(
            "MILK-01".to_string(),
            SupplierCatalogItem {
                supplier: SupplierRating {
                    supplier_id: "SUP-01".to_string(),
                    name: "FoodMaster Almaty".to_string(),
                    on_time_delivery_rate: 0.99,
                    quality_score: 4.8,
                    payment_terms_days: 14,
                },
                unit_price_kzt: 480.0,
            },
        );

        let po_list = AutoReorderAggregator::generate_purchase_orders(&rules, &stocks, &catalog);
        assert_eq!(po_list.len(), 1);
        let po = &po_list[0];
        assert_eq!(po.lines.len(), 1);
        assert_eq!(po.lines[0].sku, "MILK-01");
        assert_eq!(po.lines[0].ordered_qty, 45.0);
        assert_eq!(po.calculate_subtotal(), 45.0 * 480.0); // 21,600 KZT
        assert!((po.calculate_grand_total() - 24192.0).abs() < 0.001); // + 12% VAT
    }
}

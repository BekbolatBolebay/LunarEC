// LunarEC Stock & Pricing Engine - Dynamic Discount & Margin Protection Matrix
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DiscountType {
    Percentage(f64),
    FixedAmount(f64),
    BuyXGetYFree { buy_qty: u32, free_qty: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeTier {
    pub min_quantity: f64,
    pub discount_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscountRule {
    pub id: String,
    pub name: String,
    pub item_id: Option<String>,
    pub category_id: Option<String>,
    pub discount_type: DiscountType,
    pub volume_tiers: Vec<VolumeTier>,
    pub min_margin_protection_percent: f64, // e.g. 10.0% minimum margin required
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscountCalculationResult {
    pub original_unit_price: f64,
    pub final_unit_price: f64,
    pub quantity: f64,
    pub gross_total: f64,
    pub net_total: f64,
    pub total_discount_amount: f64,
    pub effective_discount_percent: f64,
    pub margin_protected: bool,
}

pub struct DiscountEngine;

impl DiscountEngine {
    /// Calculate best applicable discount for an item while strictly protecting minimum profit margin
    pub fn calculate_price(
        unit_price: f64,
        cost_price: f64,
        quantity: f64,
        rule: &DiscountRule,
    ) -> DiscountCalculationResult {
        let gross_total = unit_price * quantity;
        if !rule.is_active || quantity <= 0.0 || unit_price <= 0.0 {
            return DiscountCalculationResult {
                original_unit_price: unit_price,
                final_unit_price: unit_price,
                quantity,
                gross_total,
                net_total: gross_total,
                total_discount_amount: 0.0,
                effective_discount_percent: 0.0,
                margin_protected: false,
            };
        }

        // 1. Calculate base discount according to type
        let mut raw_discount_amount = match &rule.discount_type {
            DiscountType::Percentage(pct) => gross_total * (pct / 100.0),
            DiscountType::FixedAmount(amt) => amt * quantity,
            DiscountType::BuyXGetYFree { buy_qty, free_qty } => {
                let set_size = (*buy_qty + *free_qty) as f64;
                if set_size > 0.0 {
                    let sets = (quantity / set_size).floor();
                    sets * (*free_qty as f64) * unit_price
                } else {
                    0.0
                }
            }
        };

        // 2. Check Volume Tiers for higher volume discount
        if !rule.volume_tiers.is_empty() {
            let mut best_tier_pct = 0.0;
            for tier in &rule.volume_tiers {
                if quantity >= tier.min_quantity && tier.discount_percent > best_tier_pct {
                    best_tier_pct = tier.discount_percent;
                }
            }
            if best_tier_pct > 0.0 {
                let tier_discount = gross_total * (best_tier_pct / 100.0);
                if tier_discount > raw_discount_amount {
                    raw_discount_amount = tier_discount;
                }
            }
        }

        // 3. Margin Protection Floor Check
        // Minimum allowed revenue = (cost_price * (1 + min_margin%)) * quantity
        let min_allowed_unit_price = cost_price * (1.0 + rule.min_margin_protection_percent / 100.0);
        let min_allowed_total = min_allowed_unit_price * quantity;
        let max_allowable_discount = (gross_total - min_allowed_total).max(0.0);

        let mut margin_protected = false;
        let applied_discount_amount = if raw_discount_amount > max_allowable_discount {
            margin_protected = true;
            max_allowable_discount
        } else {
            raw_discount_amount
        };

        let net_total = (gross_total - applied_discount_amount).max(0.0);
        let final_unit_price = if quantity > 0.0 { net_total / quantity } else { unit_price };
        let effective_discount_percent = if gross_total > 0.0 {
            (applied_discount_amount / gross_total) * 100.0
        } else {
            0.0
        };

        DiscountCalculationResult {
            original_unit_price: unit_price,
            final_unit_price,
            quantity,
            gross_total,
            net_total,
            total_discount_amount: applied_discount_amount,
            effective_discount_percent,
            margin_protected,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_percentage_discount_calculation() {
        let rule = DiscountRule {
            id: "rule-10".to_string(),
            name: "10% Spring Sale".to_string(),
            item_id: Some("coffee-beans".to_string()),
            category_id: None,
            discount_type: DiscountType::Percentage(10.0),
            volume_tiers: vec![],
            min_margin_protection_percent: 5.0,
            is_active: true,
        };

        let result = DiscountEngine::calculate_price(1000.0, 500.0, 2.0, &rule);
        assert_eq!(result.gross_total, 2000.0);
        assert_eq!(result.total_discount_amount, 200.0);
        assert_eq!(result.net_total, 1800.0);
        assert_eq!(result.final_unit_price, 900.0);
        assert!(!result.margin_protected);
    }

    #[test]
    fn test_volume_tier_escalation() {
        let rule = DiscountRule {
            id: "rule-volume".to_string(),
            name: "Wholesale Bulk Tier".to_string(),
            item_id: None,
            category_id: Some("beverages".to_string()),
            discount_type: DiscountType::Percentage(5.0),
            volume_tiers: vec![
                VolumeTier { min_quantity: 10.0, discount_percent: 15.0 },
                VolumeTier { min_quantity: 50.0, discount_percent: 25.0 },
            ],
            min_margin_protection_percent: 10.0,
            is_active: true,
        };

        // 12 items should get 15% tier discount
        let result = DiscountEngine::calculate_price(100.0, 40.0, 12.0, &rule);
        assert_eq!(result.gross_total, 1200.0);
        assert_eq!(result.total_discount_amount, 180.0); // 15% of 1200
        assert_eq!(result.net_total, 1020.0);
        assert_eq!(result.effective_discount_percent, 15.0);
    }

    #[test]
    fn test_margin_protection_floor_triggers() {
        // High 50% discount requested on item with tight margin
        let rule = DiscountRule {
            id: "rule-protect".to_string(),
            name: "Aggressive Promo".to_string(),
            item_id: None,
            category_id: None,
            discount_type: DiscountType::Percentage(50.0), // would reduce unit price from 100 to 50
            volume_tiers: vec![],
            min_margin_protection_percent: 20.0, // cost 80, min price must be 80 * 1.2 = 96
            is_active: true,
        };

        let result = DiscountEngine::calculate_price(100.0, 80.0, 1.0, &rule);
        assert!(result.margin_protected);
        assert_eq!(result.final_unit_price, 96.0); // capped at floor
        assert_eq!(result.total_discount_amount, 4.0);
    }
}

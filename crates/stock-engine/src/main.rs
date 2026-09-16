use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockItem {
    pub id: String,
    pub name: String,
    pub unit: String,
    pub current_qty: f64,
    pub min_threshold: f64,
    pub unit_cost: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Ingredient {
    pub item_id: String,
    pub required_qty: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Recipe {
    pub id: String,
    pub name: String,
    pub sale_price: f64,
    pub ingredients: Vec<Ingredient>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CalculationResult {
    pub dish_name: String,
    pub sale_price: f64,
    pub total_cogs: f64,
    pub gross_margin_percent: f64,
    pub is_profitable: bool,
    pub low_stock_warnings: Vec<String>,
}

pub fn calculate_cogs(recipe: &Recipe, stock: &HashMap<String, StockItem>) -> CalculationResult {
    let mut total_cogs = 0.0;
    let mut warnings = Vec::new();

    for ing in &recipe.ingredients {
        if let Some(item) = stock.get(&ing.item_id) {
            let cost = ing.required_qty * item.unit_cost;
            total_cogs += cost;

            if item.current_qty < item.min_threshold {
                warnings.push(format!(
                    "⚠️ [ДЕФИЦИТ] {}: Қалдық {:.2} {}, Мин шегі {:.2} {}",
                    item.name, item.current_qty, item.unit, item.min_threshold, item.unit
                ));
            }
        } else {
            warnings.push(format!("❌ Белгісіз ингредиент ID: {}", ing.item_id));
        }
    }

    let margin = if recipe.sale_price > 0.0 {
        ((recipe.sale_price - total_cogs) / recipe.sale_price) * 100.0
    } else {
        0.0
    };

    CalculationResult {
        dish_name: recipe.name.clone(),
        sale_price: recipe.sale_price,
        total_cogs,
        gross_margin_percent: (margin * 100.0).round() / 100.0,
        is_profitable: margin > 50.0,
        low_stock_warnings: warnings,
    }
}

fn main() {
    println!("🦀 [LunarEC Rust Core] Stock & BOM Calculation Engine v0.1.0");

    let mut stock = HashMap::new();
    stock.insert(
        "beef-01".to_string(),
        StockItem {
            id: "beef-01".to_string(),
            name: "Сиыр еті".to_string(),
            unit: "кг".to_string(),
            current_qty: 18.5,
            min_threshold: 25.0, // Deficit
            unit_cost: 4200.0,
        },
    );
    stock.insert(
        "bun-02".to_string(),
        StockItem {
            id: "bun-02".to_string(),
            name: "Бриошь бөлкесі".to_string(),
            unit: "дана".to_string(),
            current_qty: 120.0,
            min_threshold: 50.0,
            unit_cost: 180.0,
        },
    );

    let burger_recipe = Recipe {
        id: "rec-burger".to_string(),
        name: "Lunar Black Angus Burger".to_string(),
        sale_price: 3800.0,
        ingredients: vec![
            Ingredient { item_id: "beef-01".to_string(), required_qty: 0.18 },
            Ingredient { item_id: "bun-02".to_string(), required_qty: 1.0 },
        ],
    };

    let result = calculate_cogs(&burger_recipe, &stock);
    let json_output = serde_json::to_string_pretty(&result).unwrap();
    println!("{}", json_output);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cogs_calculation() {
        let mut stock = HashMap::new();
        stock.insert(
            "meat".to_string(),
            StockItem {
                id: "meat".to_string(),
                name: "Ет".to_string(),
                unit: "кг".to_string(),
                current_qty: 10.0,
                min_threshold: 5.0,
                unit_cost: 4000.0,
            },
        );

        let recipe = Recipe {
            id: "r1".to_string(),
            name: "Стейк".to_string(),
            sale_price: 5000.0,
            ingredients: vec![Ingredient { item_id: "meat".to_string(), required_qty: 0.25 }],
        };

        let res = calculate_cogs(&recipe, &stock);
        assert_eq!(res.total_cogs, 1000.0);
        assert_eq!(res.gross_margin_percent, 80.0);
        assert!(res.is_profitable);
        assert!(res.low_stock_warnings.is_empty());
    }

    #[test]
    fn test_low_stock_detection() {
        let mut stock = HashMap::new();
        stock.insert(
            "cheese".to_string(),
            StockItem {
                id: "cheese".to_string(),
                name: "Ірімшік".to_string(),
                unit: "кг".to_string(),
                current_qty: 2.0,
                min_threshold: 5.0,
                unit_cost: 3000.0,
            },
        );

        let recipe = Recipe {
            id: "r2".to_string(),
            name: "Чизкейк".to_string(),
            sale_price: 1500.0,
            ingredients: vec![Ingredient { item_id: "cheese".to_string(), required_qty: 0.1 }],
        };

        let res = calculate_cogs(&recipe, &stock);
        assert_eq!(res.low_stock_warnings.len(), 1);
    }
}

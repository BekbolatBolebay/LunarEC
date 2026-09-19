//! Dynamic Recipe Portion Scaler for Banquet/Catering calculation
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScaledIngredient {
    pub ingredient_id: String,
    pub base_qty: f64,
    pub scaled_qty: f64,
    pub unit: String,
}

pub fn scale_recipe(base_ingredients: &[(&str, f64, &str)], factor: f64) -> Vec<ScaledIngredient> {
    base_ingredients
        .iter()
        .map(|(id, qty, unit)| ScaledIngredient {
            ingredient_id: id.to_string(),
            base_qty: *qty,
            scaled_qty: qty * factor,
            unit: unit.to_string(),
        })
        .collect()
}

//! Dynamic Recipe Portion Scaler for Banquet & Catering Kitchen Planning
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ScaledIngredient {
    pub ingredient_id: String,
    pub base_qty: f64,
    pub scaled_qty: f64,
    pub unit: String,
}

pub fn scale_recipe(base_ingredients: &[(&str, f64, &str)], factor: f64) -> Result<Vec<ScaledIngredient>, String> {
    if factor <= 0.0 {
        return Err("Масштаб коэффициенті 0-ден үлкен болуы қажет".to_string());
    }

    let result = base_ingredients
        .iter()
        .map(|(id, qty, unit)| {
            let safe_base = qty.max(0.0);
            let scaled = ((safe_base * factor) * 1000.0).round() / 1000.0;
            ScaledIngredient {
                ingredient_id: id.to_string(),
                base_qty: safe_base,
                scaled_qty: scaled,
                unit: unit.to_string(),
            }
        })
        .collect();

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scale_recipe_valid() {
        let base = [
            ("FLOUR", 0.5, "kg"),
            ("SUGAR", 0.2, "kg"),
            ("EGGS", 4.0, "pcs"),
        ];

        let scaled = scale_recipe(&base, 10.0).unwrap();
        assert_eq!(scaled.len(), 3);
        assert_eq!(scaled[0].scaled_qty, 5.0);
        assert_eq!(scaled[1].scaled_qty, 2.0);
        assert_eq!(scaled[2].scaled_qty, 40.0);
    }

    #[test]
    fn test_scale_recipe_invalid_factor() {
        let base = [("SALT", 0.01, "kg")];
        assert!(scale_recipe(&base, 0.0).is_err());
        assert!(scale_recipe(&base, -2.5).is_err());
    }
}

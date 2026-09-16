use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ItemType {
    RawMaterial,    // Шикізат (ет, тұз, ұн)
    SemiFinished,   // Жартылай фабрикат (котлет, маринадталған ет, соус)
    FinishedDish,   // Дайын тағам (бургер, стейк, кофе)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BOMNode {
    pub item_id: String,
    pub name: String,
    pub item_type: ItemType,
    pub unit: String,
    pub unit_cost: f64,
    pub loss_percentage: f64, // Шығын / қалдық пайызы (Cold/Hot processing waste)
    pub sub_components: Vec<BOMComponent>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BOMComponent {
    pub component_id: String,
    pub quantity: f64,
}

pub struct BOMCalculator {
    pub items: HashMap<String, BOMNode>,
}

impl BOMCalculator {
    pub fn new() -> Self {
        Self {
            items: HashMap::new(),
        }
    }

    pub fn register_item(&mut self, item: BOMNode) {
        self.items.insert(item.item_id.clone(), item);
    }

    /// Recursively calculates total cost for finished dish or semi-finished good
    pub fn resolve_cost(&self, item_id: &str) -> f64 {
        if let Some(item) = self.items.get(item_id) {
            match item.item_type {
                ItemType::RawMaterial => item.unit_cost,
                ItemType::SemiFinished | ItemType::FinishedDish => {
                    let mut base_cost = 0.0;
                    for comp in &item.sub_components {
                        let comp_cost = self.resolve_cost(&comp.component_id);
                        base_cost += comp_cost * comp.quantity;
                    }

                    // Apply thermal/mechanical waste percentage
                    // Effective cost = base_cost / (1 - loss_percentage / 100)
                    if item.loss_percentage > 0.0 && item.loss_percentage < 100.0 {
                        base_cost / (1.0 - (item.loss_percentage / 100.0))
                    } else {
                        base_cost
                    }
                }
            }
        } else {
            0.0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_multilevel_bom_tree() {
        let mut calc = BOMCalculator::new();

        // 1. Raw Materials
        calc.register_item(BOMNode {
            item_id: "raw-beef".to_string(),
            name: "Сиыр еті".to_string(),
            item_type: ItemType::RawMaterial,
            unit: "кг".to_string(),
            unit_cost: 4000.0,
            loss_percentage: 0.0,
            sub_components: vec![],
        });

        calc.register_item(BOMNode {
            item_id: "raw-salt".to_string(),
            name: "Тұз/дәмдеуіштер".to_string(),
            item_type: ItemType::RawMaterial,
            unit: "кг".to_string(),
            unit_cost: 500.0,
            loss_percentage: 0.0,
            sub_components: vec![],
        });

        // 2. Semi-Finished: Patty (Котлет) with 10% thermal frying loss
        calc.register_item(BOMNode {
            item_id: "semi-patty".to_string(),
            name: "Дайын Бургер Котлеті".to_string(),
            item_type: ItemType::SemiFinished,
            unit: "дана".to_string(),
            unit_cost: 0.0, // Calculated dynamically
            loss_percentage: 10.0,
            sub_components: vec![
                BOMComponent { component_id: "raw-beef".to_string(), quantity: 0.18 }, // 720 tg
                BOMComponent { component_id: "raw-salt".to_string(), quantity: 0.01 }, // 5 tg -> 725 tg / 0.9 = 805.5 tg
            ],
        });

        // 3. Finished Dish: Burger
        calc.register_item(BOMNode {
            item_id: "dish-burger".to_string(),
            name: "Grand Burger".to_string(),
            item_type: ItemType::FinishedDish,
            unit: "порция".to_string(),
            unit_cost: 0.0,
            loss_percentage: 0.0,
            sub_components: vec![
                BOMComponent { component_id: "semi-patty".to_string(), quantity: 1.0 },
            ],
        });

        let cost = calc.resolve_cost("dish-burger");
        assert!(cost > 800.0 && cost < 810.0);
    }
}

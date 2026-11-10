//! LunarEC ERP/CRM - Hybrid Stock Allocation Engine
//!
//! Intelligently routes inventory deductions according to item perishability:
//! - **Perishable Goods (Тез бұзылатын өнімдер)**: Routed via **FEFO** (First Expired, First Out)
//!   and **FIFO** to prevent spoilage and kitchen food waste.
//! - **Non-Perishable Goods (Ұзақ сақталатын тауарлар)**: Routed via **LIFO** (Last In, First Out)
//!   or lowest retrieval cost to reduce warehouse re-stacking overhead.
//! - **Multi-Warehouse / Multi-Bin Routing**: Automatically splits fulfillment across
//!   zones (e.g. Main Cold Room -> Kitchen Line -> Bar Counter).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ItemCategory {
    /// Тез бұзылатын тағамдар (Сүт, ет, балық, көкөніс) - FEFO / FIFO басымдығы
    Perishable,
    /// Құрғақ, ұзақ сақталатын тауарлар (Жарма, консерві, қаптама, ыдыс) - LIFO басымдығы
    NonPerishable,
    /// Қатаң есептегі премиум өнімдер (Алкоголь, қымбат деликатес) - FIFO + Сериялық бақылау
    HighValueControlled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StockLot {
    pub lot_id: String,
    pub sku: String,
    pub warehouse_id: String,
    pub bin_id: String,
    pub quantity: f64,
    pub unit_cost: f64,
    pub received_timestamp: u64,
    pub expiry_timestamp: Option<u64>,
    pub is_quarantined: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllocationRequest {
    pub sku: String,
    pub category: ItemCategory,
    pub required_quantity: f64,
    pub preferred_warehouse: Option<String>,
    pub allow_split_warehouse: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AllocatedLotItem {
    pub lot_id: String,
    pub warehouse_id: String,
    pub bin_id: String,
    pub allocated_qty: f64,
    pub unit_cost: f64,
    pub lot_cogs: f64,
    pub expiry_timestamp: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AllocationResult {
    pub sku: String,
    pub requested_qty: f64,
    pub fulfilled_qty: f64,
    pub unfulfilled_qty: f64,
    pub total_cogs: f64,
    pub is_fully_fulfilled: bool,
    pub allocations: Vec<AllocatedLotItem>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AllocationError {
    ZeroOrNegativeQuantity,
    SkuNotFound(String),
}

impl std::fmt::Display for AllocationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AllocationError::ZeroOrNegativeQuantity => write!(f, "Сұратылған тауар саны нөл немесе теріс болмауы керек"),
            AllocationError::SkuNotFound(sku) => write!(f, "Тауар артикулы табылмады: {}", sku),
        }
    }
}

impl std::error::Error for AllocationError {}

pub struct HybridAllocator {
    pub lots: Vec<StockLot>,
}

impl HybridAllocator {
    pub fn new() -> Self {
        Self { lots: Vec::new() }
    }

    pub fn with_lots(lots: Vec<StockLot>) -> Self {
        Self { lots }
    }

    pub fn add_lot(&mut self, lot: StockLot) {
        if lot.quantity > 0.0 {
            self.lots.push(lot);
        }
    }

    pub fn total_on_hand(&self, sku: &str) -> f64 {
        self.lots
            .iter()
            .filter(|l| l.sku == sku && !l.is_quarantined)
            .map(|l| l.quantity)
            .sum()
    }

    /// Intelligently allocates stock batches according to category perishability rules
    pub fn allocate(
        &mut self,
        request: &AllocationRequest,
        current_time: u64,
    ) -> Result<AllocationResult, AllocationError> {
        if request.required_quantity <= 0.0 {
            return Err(AllocationError::ZeroOrNegativeQuantity);
        }

        let mut warnings = Vec::new();

        // 1. Filter lots matching SKU and not quarantined
        let mut candidate_indices: Vec<usize> = self
            .lots
            .iter()
            .enumerate()
            .filter(|(_, lot)| lot.sku == request.sku && !lot.is_quarantined && lot.quantity > 0.0)
            .map(|(idx, _)| idx)
            .collect();

        if candidate_indices.is_empty() {
            return Ok(AllocationResult {
                sku: request.sku.clone(),
                requested_qty: request.required_quantity,
                fulfilled_qty: 0.0,
                unfulfilled_qty: request.required_quantity,
                total_cogs: 0.0,
                is_fully_fulfilled: false,
                allocations: Vec::new(),
                warnings: vec!["Қоймада бұл артикул бойынша қолжетімді қалдық жоқ".to_string()],
            });
        }

        // 2. Filter out already expired lots for Perishable goods
        if request.category == ItemCategory::Perishable {
            let before_count = candidate_indices.len();
            candidate_indices.retain(|&idx| {
                if let Some(exp) = self.lots[idx].expiry_timestamp {
                    exp > current_time
                } else {
                    true
                }
            });
            let expired_count = before_count - candidate_indices.len();
            if expired_count > 0 {
                warnings.push(format!(
                    "Мерзімі өткен {} топтама (партия) есептен автоматты түрде алынып тасталды (Бұзылудан қорғау)",
                    expired_count
                ));
            }
        }

        // 3. Sort candidate lots based on policy
        let lots_ref = &self.lots;
        match request.category {
            ItemCategory::Perishable => {
                // FEFO: Earliest expiry date first. If expiry is missing, fallback to FIFO (earliest received)
                candidate_indices.sort_by(|&a, &b| {
                    let lot_a = &lots_ref[a];
                    let lot_b = &lots_ref[b];
                    match (lot_a.expiry_timestamp, lot_b.expiry_timestamp) {
                        (Some(exp_a), Some(exp_b)) => exp_a.cmp(&exp_b),
                        (Some(_), None) => std::cmp::Ordering::Less,
                        (None, Some(_)) => std::cmp::Ordering::Greater,
                        (None, None) => lot_a.received_timestamp.cmp(&lot_b.received_timestamp),
                    }
                });
            }
            ItemCategory::NonPerishable => {
                // LIFO: Latest received lot first (reduces warehouse re-stacking cost)
                candidate_indices.sort_by(|&a, &b| {
                    let lot_a = &lots_ref[a];
                    let lot_b = &lots_ref[b];
                    lot_b.received_timestamp.cmp(&lot_a.received_timestamp)
                });
            }
            ItemCategory::HighValueControlled => {
                // FIFO: First In, First Out for strict chain of custody
                candidate_indices.sort_by(|&a, &b| {
                    let lot_a = &lots_ref[a];
                    let lot_b = &lots_ref[b];
                    lot_a.received_timestamp.cmp(&lot_b.received_timestamp)
                });
            }
        }

        // Priority boost for preferred warehouse if specified
        if let Some(ref pref_wh) = request.preferred_warehouse {
            candidate_indices.sort_by_key(|&idx| {
                if self.lots[idx].warehouse_id == *pref_wh {
                    0
                } else {
                    1
                }
            });
        }

        // 4. Perform deductions
        let mut remaining_needed = request.required_quantity;
        let mut allocations = Vec::new();
        let mut total_cogs = 0.0;
        let mut used_warehouses = std::collections::HashSet::new();

        for idx in candidate_indices {
            if remaining_needed <= 0.0 {
                break;
            }

            let lot = &mut self.lots[idx];
            
            // Check if multi-warehouse split is disallowed
            if !request.allow_split_warehouse
                && !used_warehouses.is_empty()
                && !used_warehouses.contains(&lot.warehouse_id)
            {
                continue;
            }

            let deduct_qty = lot.quantity.min(remaining_needed);
            lot.quantity -= deduct_qty;
            remaining_needed -= deduct_qty;

            let lot_cogs = deduct_qty * lot.unit_cost;
            total_cogs += lot_cogs;
            used_warehouses.insert(lot.warehouse_id.clone());

            allocations.push(AllocatedLotItem {
                lot_id: lot.lot_id.clone(),
                warehouse_id: lot.warehouse_id.clone(),
                bin_id: lot.bin_id.clone(),
                allocated_qty: deduct_qty,
                unit_cost: lot.unit_cost,
                lot_cogs,
                expiry_timestamp: lot.expiry_timestamp,
            });
        }

        // Clean up empty lots
        self.lots.retain(|lot| lot.quantity > 0.00001);

        let fulfilled_qty = request.required_quantity - remaining_needed;
        let is_fully_fulfilled = remaining_needed.abs() < 1e-6;

        if !is_fully_fulfilled {
            warnings.push(format!(
                "Сұраныс толық орындалмады: тапсырыс {:.2}, бөлінгені {:.2}, жетіспейтіні {:.2}",
                request.required_quantity, fulfilled_qty, remaining_needed
            ));
        }

        if used_warehouses.len() > 1 {
            warnings.push(format!(
                "Тауар бірнеше қойма аймағынан ({}) біріктіріліп жиналды (Split-fulfillment)",
                used_warehouses.len()
            ));
        }

        Ok(AllocationResult {
            sku: request.sku.clone(),
            requested_qty: request.required_quantity,
            fulfilled_qty,
            unfulfilled_qty: remaining_needed.max(0.0),
            total_cogs,
            is_fully_fulfilled,
            allocations,
            warnings,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_perishable_fefo_prefers_earliest_expiry() {
        let mut allocator = HybridAllocator::new();

        // Lot A: Expires in 100 days
        allocator.add_lot(StockLot {
            lot_id: "LOT-A".to_string(),
            sku: "MILK-3.2%".to_string(),
            warehouse_id: "COLD-ROOM-1".to_string(),
            bin_id: "SHELF-A1".to_string(),
            quantity: 50.0,
            unit_cost: 350.0,
            received_timestamp: 1000,
            expiry_timestamp: Some(2000), // Expires later
            is_quarantined: false,
        });

        // Lot B: Expires in 10 days
        allocator.add_lot(StockLot {
            lot_id: "LOT-B".to_string(),
            sku: "MILK-3.2%".to_string(),
            warehouse_id: "COLD-ROOM-1".to_string(),
            bin_id: "SHELF-A2".to_string(),
            quantity: 30.0,
            unit_cost: 340.0,
            received_timestamp: 1200, // Received later, but expires EARLIER!
            expiry_timestamp: Some(1500), // Expires sooner -> must be chosen first!
            is_quarantined: false,
        });

        let req = AllocationRequest {
            sku: "MILK-3.2%".to_string(),
            category: ItemCategory::Perishable,
            required_quantity: 40.0,
            preferred_warehouse: None,
            allow_split_warehouse: true,
        };

        let res = allocator.allocate(&req, 1100).expect("Allocation should succeed");

        assert!(res.is_fully_fulfilled);
        assert_eq!(res.fulfilled_qty, 40.0);
        assert_eq!(res.allocations.len(), 2);

        // First lot allocated MUST be LOT-B because it expires earlier!
        assert_eq!(res.allocations[0].lot_id, "LOT-B");
        assert_eq!(res.allocations[0].allocated_qty, 30.0);

        // Remainder 10.0 taken from LOT-A
        assert_eq!(res.allocations[1].lot_id, "LOT-A");
        assert_eq!(res.allocations[1].allocated_qty, 10.0);

        // COGS = 30 * 340 + 10 * 350 = 10200 + 3500 = 13700
        assert_eq!(res.total_cogs, 13700.0);
    }

    #[test]
    fn test_non_perishable_lifo_prefers_latest_arrival() {
        let mut allocator = HybridAllocator::new();

        // Lot A: Received first
        allocator.add_lot(StockLot {
            lot_id: "LOT-OLD".to_string(),
            sku: "BOX-CARDBOARD".to_string(),
            warehouse_id: "DRY-MAIN".to_string(),
            bin_id: "PALLET-1".to_string(),
            quantity: 100.0,
            unit_cost: 50.0,
            received_timestamp: 1000,
            expiry_timestamp: None,
            is_quarantined: false,
        });

        // Lot B: Received recently (on top of stack)
        allocator.add_lot(StockLot {
            lot_id: "LOT-NEW".to_string(),
            sku: "BOX-CARDBOARD".to_string(),
            warehouse_id: "DRY-MAIN".to_string(),
            bin_id: "PALLET-2".to_string(),
            quantity: 50.0,
            unit_cost: 55.0,
            received_timestamp: 2000,
            expiry_timestamp: None,
            is_quarantined: false,
        });

        let req = AllocationRequest {
            sku: "BOX-CARDBOARD".to_string(),
            category: ItemCategory::NonPerishable,
            required_quantity: 30.0,
            preferred_warehouse: None,
            allow_split_warehouse: true,
        };

        let res = allocator.allocate(&req, 2100).expect("Allocation should succeed");

        assert!(res.is_fully_fulfilled);
        assert_eq!(res.allocations.len(), 1);
        // LIFO allocates from the most recently received lot (LOT-NEW)
        assert_eq!(res.allocations[0].lot_id, "LOT-NEW");
        assert_eq!(res.allocations[0].allocated_qty, 30.0);
        assert_eq!(res.total_cogs, 30.0 * 55.0);
    }

    #[test]
    fn test_perishable_skips_expired_lots() {
        let mut allocator = HybridAllocator::new();

        // Expired lot
        allocator.add_lot(StockLot {
            lot_id: "LOT-EXPIRED".to_string(),
            sku: "SALAD-FRESH".to_string(),
            warehouse_id: "KITCHEN".to_string(),
            bin_id: "FRIDGE-1".to_string(),
            quantity: 20.0,
            unit_cost: 500.0,
            received_timestamp: 1000,
            expiry_timestamp: Some(1500), // Expired at 1500
            is_quarantined: false,
        });

        // Fresh lot
        allocator.add_lot(StockLot {
            lot_id: "LOT-FRESH".to_string(),
            sku: "SALAD-FRESH".to_string(),
            warehouse_id: "KITCHEN".to_string(),
            bin_id: "FRIDGE-2".to_string(),
            quantity: 25.0,
            unit_cost: 520.0,
            received_timestamp: 1400,
            expiry_timestamp: Some(2500), // Valid until 2500
            is_quarantined: false,
        });

        let req = AllocationRequest {
            sku: "SALAD-FRESH".to_string(),
            category: ItemCategory::Perishable,
            required_quantity: 15.0,
            preferred_warehouse: None,
            allow_split_warehouse: true,
        };

        // Current time is 1800 (LOT-EXPIRED is already bad)
        let res = allocator.allocate(&req, 1800).expect("Allocation should succeed");

        assert!(res.is_fully_fulfilled);
        assert_eq!(res.allocations.len(), 1);
        assert_eq!(res.allocations[0].lot_id, "LOT-FRESH");
        assert_eq!(res.allocations[0].allocated_qty, 15.0);
        assert!(res.warnings.iter().any(|w| w.contains("Мерзімі өткен")));
    }
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub enum WarehouseLocation {
    CentralColdStorage, // Орталық тоңазытқыш қоймасы
    KitchenMainPrep,    // Негізгі асүй цехы
    BarMain,            // Басты бар
    BarTerrace,         // Терраса бары
    VIPLoungeStorage,   // VIP зал қоймасы
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocationStock {
    pub location: WarehouseLocation,
    pub item_sku: String,
    pub available_qty: f64,
    pub reserved_qty: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransferRequest {
    pub transfer_id: String,
    pub from_location: WarehouseLocation,
    pub to_location: WarehouseLocation,
    pub item_sku: String,
    pub quantity: f64,
    pub requested_by: String,
    pub status: TransferStatus,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum TransferStatus {
    Pending,
    Approved,
    Completed,
    Rejected(String),
}

pub struct MultiWarehouseManager {
    // Map of (WarehouseLocation, item_sku) -> LocationStock
    pub inventory: HashMap<(WarehouseLocation, String), LocationStock>,
    pub transfer_history: Vec<TransferRequest>,
}

impl MultiWarehouseManager {
    pub fn new() -> Self {
        Self {
            inventory: HashMap::new(),
            transfer_history: Vec::new(),
        }
    }

    pub fn set_stock(&mut self, location: WarehouseLocation, item_sku: &str, qty: f64) {
        let safe_qty = qty.max(0.0);
        self.inventory.insert(
            (location.clone(), item_sku.to_string()),
            LocationStock {
                location,
                item_sku: item_sku.to_string(),
                available_qty: safe_qty,
                reserved_qty: 0.0,
            },
        );
    }

    pub fn get_available(&self, location: &WarehouseLocation, item_sku: &str) -> f64 {
        self.inventory
            .get(&(location.clone(), item_sku.to_string()))
            .map(|s| (s.available_qty - s.reserved_qty).max(0.0))
            .unwrap_or(0.0)
    }

    pub fn reserve_for_order(&mut self, location: &WarehouseLocation, item_sku: &str, qty: f64) -> Result<(), String> {
        if qty <= 0.0 {
            return Err("Резервтеу көлемі 0-ден үлкен болуы керек".to_string());
        }
        let key = (location.clone(), item_sku.to_string());
        if let Some(stock) = self.inventory.get_mut(&key) {
            let free = (stock.available_qty - stock.reserved_qty).max(0.0);
            if free >= qty {
                stock.reserved_qty += qty;
                Ok(())
            } else {
                Err(format!(
                    "Қор жеткіліксіз! Сұралды: {:.2}, Қолжетімді: {:.2}",
                    qty, free
                ))
            }
        } else {
            Err("Аталған қоймада тауар табылмады".to_string())
        }
    }

    pub fn release_reservation(&mut self, location: &WarehouseLocation, item_sku: &str, qty: f64) -> Result<(), String> {
        let key = (location.clone(), item_sku.to_string());
        if let Some(stock) = self.inventory.get_mut(&key) {
            stock.reserved_qty = (stock.reserved_qty - qty).max(0.0);
            Ok(())
        } else {
            Err("Тауар табылмады".to_string())
        }
    }

    pub fn execute_transfer(&mut self, mut req: TransferRequest) -> Result<TransferRequest, String> {
        if req.quantity <= 0.0 {
            req.status = TransferStatus::Rejected("Тасымалдау көлемі 0-ден үлкен болуы қажет".to_string());
            self.transfer_history.push(req.clone());
            return Err("Тасымалдау көлемі жарамсыз".to_string());
        }

        if req.from_location == req.to_location {
            req.status = TransferStatus::Rejected("Шығыс және кіріс қоймалары бірдей бола алмайды".to_string());
            self.transfer_history.push(req.clone());
            return Err("Бірдей қоймаға тасымалдау мүмкін емес".to_string());
        }

        let from_key = (req.from_location.clone(), req.item_sku.clone());
        let to_key = (req.to_location.clone(), req.item_sku.clone());

        let free_at_origin = self.get_available(&req.from_location, &req.item_sku);
        if free_at_origin < req.quantity {
            req.status = TransferStatus::Rejected(format!(
                "Шығыс қоймасында тауар жеткіліксіз (Бар болғаны: {:.2})",
                free_at_origin
            ));
            self.transfer_history.push(req.clone());
            return Err("Тасымалдаудан бас тартылды: қор жеткіліксіз".to_string());
        }

        // Deduct from origin
        if let Some(src) = self.inventory.get_mut(&from_key) {
            src.available_qty -= req.quantity;
        }

        // Add to destination
        let dest = self.inventory.entry(to_key).or_insert(LocationStock {
            location: req.to_location.clone(),
            item_sku: req.item_sku.clone(),
            available_qty: 0.0,
            reserved_qty: 0.0,
        });
        dest.available_qty += req.quantity;

        req.status = TransferStatus::Completed;
        self.transfer_history.push(req.clone());
        Ok(req)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_internal_transfer() {
        let mut mgr = MultiWarehouseManager::new();
        mgr.set_stock(WarehouseLocation::CentralColdStorage, "BEEF-01", 100.0);

        let req = TransferRequest {
            transfer_id: "TR-001".to_string(),
            from_location: WarehouseLocation::CentralColdStorage,
            to_location: WarehouseLocation::KitchenMainPrep,
            item_sku: "BEEF-01".to_string(),
            quantity: 25.0,
            requested_by: "Бас аспаз".to_string(),
            status: TransferStatus::Pending,
        };

        let result = mgr.execute_transfer(req);
        assert!(result.is_ok());
        assert_eq!(mgr.get_available(&WarehouseLocation::CentralColdStorage, "BEEF-01"), 75.0);
        assert_eq!(mgr.get_available(&WarehouseLocation::KitchenMainPrep, "BEEF-01"), 25.0);
    }

    #[test]
    fn test_transfer_negative_or_zero_quantity_rejected() {
        let mut mgr = MultiWarehouseManager::new();
        mgr.set_stock(WarehouseLocation::CentralColdStorage, "SALMON", 50.0);

        let req = TransferRequest {
            transfer_id: "TR-002".to_string(),
            from_location: WarehouseLocation::CentralColdStorage,
            to_location: WarehouseLocation::KitchenMainPrep,
            item_sku: "SALMON".to_string(),
            quantity: -5.0,
            requested_by: "Кассир".to_string(),
            status: TransferStatus::Pending,
        };

        let result = mgr.execute_transfer(req);
        assert!(result.is_err());
        assert_eq!(mgr.get_available(&WarehouseLocation::CentralColdStorage, "SALMON"), 50.0);
    }

    #[test]
    fn test_reservation_and_release() {
        let mut mgr = MultiWarehouseManager::new();
        mgr.set_stock(WarehouseLocation::BarMain, "WINE-01", 10.0);

        assert!(mgr.reserve_for_order(&WarehouseLocation::BarMain, "WINE-01", 3.0).is_ok());
        assert_eq!(mgr.get_available(&WarehouseLocation::BarMain, "WINE-01"), 7.0);

        // Attempting to reserve more than remaining free
        assert!(mgr.reserve_for_order(&WarehouseLocation::BarMain, "WINE-01", 8.0).is_err());

        // Release reservation
        assert!(mgr.release_reservation(&WarehouseLocation::BarMain, "WINE-01", 2.0).is_ok());
        assert_eq!(mgr.get_available(&WarehouseLocation::BarMain, "WINE-01"), 9.0);
    }
}

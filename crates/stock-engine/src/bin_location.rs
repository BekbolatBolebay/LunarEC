//! Warehouse Bin & Aisle Location Routing Matrix

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BinLocation {
    pub zone: String,
    pub aisle: u32,
    pub rack: u32,
    pub shelf: u32,
    pub bin: u32,
}

impl BinLocation {
    pub fn new(zone: &str, aisle: u32, rack: u32, shelf: u32, bin: u32) -> Self {
        Self {
            zone: zone.to_uppercase(),
            aisle,
            rack,
            shelf,
            bin,
        }
    }

    pub fn code(&self) -> String {
        format!("{}-{:02}-{:02}-{:02}-{}", self.zone, self.aisle, self.rack, self.shelf, self.bin)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bin_code_formatting() {
        let bin = BinLocation::new("A", 3, 12, 4, 1);
        assert_eq!(bin.code(), "A-03-12-04-1");
    }
}

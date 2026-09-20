//! Barcode EAN-13 validator
pub fn validate_ean13(code: &str) -> bool { code.len() == 13 && code.chars().all(|c| c.is_ascii_digit()) }

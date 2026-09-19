//! Multi-Currency FX Engine (KZT, USD, EUR, RUB, TRY, AED)
//!
//! Provides precision currency conversion and exchange rate indexing for international suppliers.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Currency {
    Kzt,
    Usd,
    Eur,
    Rub,
    Try,
    Aed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeRateTable {
    // Rates normalized against Base Currency (KZT)
    // e.g. USD -> 485.50 KZT
    rates_to_kzt: HashMap<Currency, f64>,
}

impl Default for ExchangeRateTable {
    fn default() -> Self {
        let mut rates = HashMap::new();
        rates.insert(Currency::Kzt, 1.0);
        rates.insert(Currency::Usd, 485.50);
        rates.insert(Currency::Eur, 532.00);
        rates.insert(Currency::Rub, 5.20);
        rates.insert(Currency::Try, 14.10);
        rates.insert(Currency::Aed, 132.20);

        Self {
            rates_to_kzt: rates,
        }
    }
}

impl ExchangeRateTable {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_rate(&mut self, currency: Currency, rate_to_kzt: f64) {
        self.rates_to_kzt.insert(currency, rate_to_kzt);
    }

    pub fn convert(&self, amount: f64, from: Currency, to: Currency) -> Option<f64> {
        if from == to {
            return Some(amount);
        }

        let from_rate = self.rates_to_kzt.get(&from)?;
        let to_rate = self.rates_to_kzt.get(&to)?;

        if *to_rate <= 0.0 {
            return None;
        }

        // Amount in KZT = amount * from_rate
        let amount_in_kzt = amount * from_rate;
        // Amount in Target = amount_in_kzt / to_rate
        Some(amount_in_kzt / to_rate)
    }

    pub fn format_amount(amount: f64, currency: Currency) -> String {
        match currency {
            Currency::Kzt => format!("{:.0} ₸", amount),
            Currency::Usd => format!("${:.2}", amount),
            Currency::Eur => format!("€{:.2}", amount),
            Currency::Rub => format!("{:.2} ₽", amount),
            Currency::Try => format!("₺{:.2}", amount),
            Currency::Aed => format!("{:.2} AED", amount),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_currency_conversion() {
        let fx = ExchangeRateTable::new();

        // 100 USD to KZT = 48,550 KZT
        let kzt = fx.convert(100.0, Currency::Usd, Currency::Kzt).unwrap();
        assert_eq!(kzt, 48550.0);

        // 48550 KZT to USD = 100 USD
        let usd = fx.convert(48550.0, Currency::Kzt, Currency::Usd).unwrap();
        assert_eq!(usd, 100.0);

        // 100 EUR to USD
        let eur_to_usd = fx.convert(100.0, Currency::Eur, Currency::Usd).unwrap();
        assert!((eur_to_usd - 109.577).abs() < 0.01);
    }

    #[test]
    fn test_custom_rate_update() {
        let mut fx = ExchangeRateTable::new();
        fx.set_rate(Currency::Usd, 500.0);

        let kzt = fx.convert(10.0, Currency::Usd, Currency::Kzt).unwrap();
        assert_eq!(kzt, 5000.0);
    }
}

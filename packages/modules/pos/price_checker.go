package pos

type PriceCheckResult struct {
	SKU            string  `json:"sku"`
	Name           string  `json:"name"`
	OriginalPrice  float64 `json:"original_price"`
	DiscountPrice  float64 `json:"discount_price"`
	DiscountPct    float64 `json:"discount_pct"`
	IsPromotional  bool    `json:"is_promotional"`
}

func CalculatePromotionalPrice(origPrice, discountPct float64) float64 {
	if discountPct <= 0 {
		return origPrice
	}
	if discountPct >= 100 {
		return 0.0
	}
	return origPrice * (1.0 - (discountPct / 100.0))
}

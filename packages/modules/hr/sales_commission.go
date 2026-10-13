package hr

func CalculateCommission(actualSales, planSales, baseBonusPct float64) float64 {
	if planSales <= 0 {
		return 0
	}
	ratio := actualSales / planSales
	if ratio >= 1.0 {
		return actualSales * (baseBonusPct * 1.2 / 100.0)
	}
	return actualSales * (baseBonusPct / 100.0)
}

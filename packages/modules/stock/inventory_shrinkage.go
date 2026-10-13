package stock

func CalculateAllowableNaturalLoss(openingStock, turnover, normPct float64) float64 {
	base := (openingStock + turnover) / 2.0
	return base * (normPct / 100.0)
}

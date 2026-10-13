package crm

func CalculateEarnedCashback(orderTotal float64, ratePct float64) float64 {
	return orderTotal * (ratePct / 100.0)
}

func MaxRedeemablePoints(orderTotal float64, maxPct float64) float64 {
	return orderTotal * (maxPct / 100.0)
}

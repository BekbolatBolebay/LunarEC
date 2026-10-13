package stock

func CalculateROP(avgDailySales, leadTimeDays, safetyStock float64) float64 {
	return (avgDailySales * leadTimeDays) + safetyStock
}

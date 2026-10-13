package accounting

func CalculateNetProfit(totalRevenue, totalCOGS, totalOperatingExpense, totalTax float64) float64 {
	grossProfit := totalRevenue - totalCOGS
	operatingProfit := grossProfit - totalOperatingExpense
	return operatingProfit - totalTax
}

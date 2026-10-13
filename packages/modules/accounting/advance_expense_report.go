package accounting

func CalculateTravelAllowance(days int, dailyRateKZT, actualHotelKZT float64) float64 {
	return (float64(days) * dailyRateKZT) + actualHotelKZT
}

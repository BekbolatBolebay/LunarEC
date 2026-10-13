package hr

func CalculateNightPayPremium(baseHourlyRate float64, nightHours float64) float64 {
	// Түнгі сағаттар кемінде 1.5 еселік мөлшерде төленеді
	return baseHourlyRate * 1.5 * nightHours
}

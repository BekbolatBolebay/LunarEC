package tax

func CalculateImportDutyAndVAT(customsValueKZT, dutyPct, vatPct float64) (dutyKZT, vatKZT, totalLandedKZT float64) {
	dutyKZT = customsValueKZT * (dutyPct / 100.0)
	taxableBase := customsValueKZT + dutyKZT
	vatKZT = taxableBase * (vatPct / 100.0)
	totalLandedKZT = customsValueKZT + dutyKZT + vatKZT
	return dutyKZT, vatKZT, totalLandedKZT
}

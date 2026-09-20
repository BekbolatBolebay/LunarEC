package engine

func CalculateVAT(amount, ratePercent float64) float64 {
    return amount * (ratePercent / 100.0)
}

package analytics

func IsMarginAllowed(salePrice, cogsCost, minMarginPct float64) bool {
	if salePrice <= 0 {
		return false
	}
	marginPct := ((salePrice - cogsCost) / salePrice) * 100.0
	return marginPct >= minMarginPct
}

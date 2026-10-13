package analytics

type ProductSalesStat struct {
	SKU string
	Revenue float64
	VarianceCoeff float64
}

func ClassifyXYZ(variance float64) string {
	if variance < 0.10 {
		return "X" // Өте тұрақты
	} else if variance < 0.25 {
		return "Y" // Орташа
	}
	return "Z" // Тұрақсыз
}

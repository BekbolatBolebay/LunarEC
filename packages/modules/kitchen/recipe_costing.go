package kitchen

type IngredientPart struct {
	Name       string
	GrossGrams float64
	NetGrams   float64
	CostPerKg  float64
}

func CalculateDishCost(parts []IngredientPart) float64 {
	var total float64
	for _, p := range parts {
		total += (p.GrossGrams / 1000.0) * p.CostPerKg
	}
	return total
}

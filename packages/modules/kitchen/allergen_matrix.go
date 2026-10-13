package kitchen

type Allergen string

const (
	AllergenGluten Allergen = "GLUTEN"
	AllergenNuts   Allergen = "NUTS"
	AllergenDairy  Allergen = "DAIRY"
)

func HasAllergen(dishAllergens []Allergen, forbidden Allergen) bool {
	for _, a := range dishAllergens {
		if a == forbidden {
			return true
		}
	}
	return false
}

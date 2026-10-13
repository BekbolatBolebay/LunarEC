package integration

func FindDuplicateSKUs(skus []string) []string {
	seen := make(map[string]bool)
	duplicates := make(map[string]bool)
	for _, s := range skus {
		if seen[s] {
			duplicates[s] = true
		}
		seen[s] = true
	}
	res := []string{}
	for d := range duplicates {
		res = append(res, d)
	}
	return res
}

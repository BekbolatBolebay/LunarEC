package stock

type BinLocation struct {
	Zone  string
	Aisle int
	Shelf int
	Tier  int
}

func FormatBinCode(b BinLocation) string {
	return b.Zone + "-" + string(rune('0'+b.Aisle)) + "-" + string(rune('0'+b.Shelf))
}

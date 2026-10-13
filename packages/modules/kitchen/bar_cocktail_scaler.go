package kitchen

type BottleStock struct {
	BottleName      string
	TotalVolumeML   float64
	RemainingML     float64
}

func PourShot(b *BottleStock, shotML float64) bool {
	if b.RemainingML < shotML {
		return false
	}
	b.RemainingML -= shotML
	return true
}

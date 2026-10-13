package stock

type PalletLedger struct {
	TotalBorrowed int
	TotalReturned int
	DepositPerPallet float64
}

func (p *PalletLedger) OutstandingDeposit() float64 {
	remaining := p.TotalBorrowed - p.TotalReturned
	if remaining < 0 {
		return 0.0
	}
	return float64(remaining) * p.DepositPerPallet
}

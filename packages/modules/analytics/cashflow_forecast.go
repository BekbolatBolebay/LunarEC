package analytics

type CashflowPeriod struct {
	OpeningBalance float64
	ExpectedInflow float64
	ExpectedOutflow float64
}

func (c *CashflowPeriod) ClosingBalance() float64 {
	return c.OpeningBalance + c.ExpectedInflow - c.ExpectedOutflow
}

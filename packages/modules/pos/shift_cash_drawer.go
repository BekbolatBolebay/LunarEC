package pos

import (
	"errors"
	"time"
)

type CashDrawerOperation struct {
	OpType    string    // "INFLOW", "OUTFLOW"
	AmountKZT float64
	Reason    string
	CashierID string
	Timestamp time.Time
}

type CashDrawerManager struct {
	CurrentBalance float64
	Operations     []CashDrawerOperation
}

func (m *CashDrawerManager) RecordInflow(amount float64, reason, cashier string) error {
	if amount <= 0 {
		return errors.New("сома оң мәнді болуы тиіс")
	}
	m.CurrentBalance += amount
	m.Operations = append(m.Operations, CashDrawerOperation{
		OpType: "INFLOW", AmountKZT: amount, Reason: reason, CashierID: cashier, Timestamp: time.Now().UTC(),
	})
	return nil
}

func (m *CashDrawerManager) RecordOutflow(amount float64, reason, cashier string) error {
	if amount <= 0 || amount > m.CurrentBalance {
		return errors.New("кассада жеткілікті сома жоқ немесе қате сома")
	}
	m.CurrentBalance -= amount
	m.Operations = append(m.Operations, CashDrawerOperation{
		OpType: "OUTFLOW", AmountKZT: amount, Reason: reason, CashierID: cashier, Timestamp: time.Now().UTC(),
	})
	return nil
}

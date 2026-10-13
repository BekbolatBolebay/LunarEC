package accounting

import "errors"

type LedgerEntry struct {
	DebitAccount  string
	CreditAccount string
	AmountKZT     float64
}

func ValidateLedgerBalance(entries []LedgerEntry) error {
	var totalDebit, totalCredit float64
	for _, e := range entries {
		if e.AmountKZT <= 0 {
			return errors.New("сома оң мәнді болуы тиіс")
		}
		totalDebit += e.AmountKZT
		totalCredit += e.AmountKZT
	}
	if totalDebit != totalCredit {
		return errors.New("дебет пен кредит балансы тең емес")
	}
	return nil
}

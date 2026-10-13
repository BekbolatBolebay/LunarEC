package pos

import "errors"

type SplitTenderItem struct {
	TenderType string  // "CASH", "KASPI_QR", "CARD"
	AmountKZT  float64
}

type SplitPaymentResult struct {
	TotalAmount float64
	PaidAmount  float64
	ChangeKZT   float64
	IsSettled   bool
}

func SettleSplitPayment(orderTotal float64, tenders []SplitTenderItem) (*SplitPaymentResult, error) {
	if orderTotal <= 0 {
		return nil, errors.New("тапсырыс сомасы нөлден үлкен болуы тиіс")
	}
	var totalPaid float64
	for _, t := range tenders {
		if t.AmountKZT < 0 {
			return nil, errors.New("төлем сомасы теріс болмауы керек")
		}
		totalPaid += t.AmountKZT
	}
	if totalPaid < orderTotal {
		return nil, errors.New("енгізілген сома тапсырыс сомасынан аз")
	}
	return &SplitPaymentResult{
		TotalAmount: orderTotal,
		PaidAmount:  totalPaid,
		ChangeKZT:   totalPaid - orderTotal,
		IsSettled:   true,
	}, nil
}

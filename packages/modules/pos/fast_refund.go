package pos

import (
	"errors"
	"time"
)

type ReturnClaim struct {
	OriginalReceiptNo string
	ItemSKU           string
	ReturnQty         float64
	RefundAmountKZT   float64
	PurchaseDate      time.Time
}

func ValidateReturnEligibility(claim ReturnClaim) error {
	daysSincePurchase := time.Since(claim.PurchaseDate).Hours() / 24.0
	if daysSincePurchase > 14.0 {
		return errors.New("14 күндік қайтару мерзімі өтіп кеткен")
	}
	if claim.ReturnQty <= 0 || claim.RefundAmountKZT <= 0 {
		return errors.New("қайтарылатын тауар саны мен сомасы дұрыс көрсетілмеген")
	}
	return nil
}

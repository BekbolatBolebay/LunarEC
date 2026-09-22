package engine

import (
	"errors"
	"math"

	"github.com/lunarec/pos-gateway/models"
)

type SplitResult struct {
	PerGuestAmount float64   `json:"per_guest_amount"`
	GuestShares    []float64 `json:"guest_shares"` // Exact share for each guest accounting for remainders
	GuestsCount    int       `json:"guests_count"`
	TotalBill      float64   `json:"total_bill"`
	Remainder      float64   `json:"remainder"`
	TipSuggested   []float64 `json:"tip_suggested"` // 5%, 10%, 15%
}

type BillSplitter struct{}

func NewBillSplitter() *BillSplitter {
	return &BillSplitter{}
}

func (bs *BillSplitter) SplitEqually(order *models.Order, guests int) (*SplitResult, error) {
	if guests <= 0 {
		return nil, errors.New("guests count must be greater than zero")
	}

	order.RecalculateTotal()
	total := order.TotalAmount
	if total < 0 {
		return nil, errors.New("order total amount cannot be negative")
	}

	// Calculate base share in cents (to prevent floating point precision issues)
	totalCents := int64(math.Round(total * 100))
	baseCentsPerGuest := totalCents / int64(guests)
	remainderCents := totalCents % int64(guests)

	guestShares := make([]float64, guests)
	for i := 0; i < guests; i++ {
		shareCents := baseCentsPerGuest
		// Distribute remainder cents 1 by 1 to initial guests
		if int64(i) < remainderCents {
			shareCents++
		}
		guestShares[i] = float64(shareCents) / 100.0
	}

	each := float64(baseCentsPerGuest) / 100.0

	return &SplitResult{
		PerGuestAmount: each,
		GuestShares:    guestShares,
		GuestsCount:    guests,
		TotalBill:      total,
		Remainder:      float64(remainderCents) / 100.0,
		TipSuggested: []float64{
			math.Round(total*0.05*100) / 100,
			math.Round(total*0.10*100) / 100,
			math.Round(total*0.15*100) / 100,
		},
	}, nil
}

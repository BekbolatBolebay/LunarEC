package engine

import (
	"errors"
	"math"

	"github.com/lunarec/pos-gateway/models"
)

type SplitResult struct {
	PerGuestAmount float64   `json:"per_guest_amount"`
	GuestsCount    int       `json:"guests_count"`
	TotalBill      float64   `json:"total_bill"`
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
	each := math.Round((total/float64(guests))*100) / 100

	return &SplitResult{
		PerGuestAmount: each,
		GuestsCount:    guests,
		TotalBill:      total,
		TipSuggested: []float64{
			math.Round(total*0.05),
			math.Round(total*0.10),
			math.Round(total*0.15),
		},
	}, nil
}

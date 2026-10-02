package engine

import (
	"testing"
	"time"

	"github.com/lunarec/pos-gateway/models"
)

func TestDiscountEngine_CustomerTierAndHappyHour(t *testing.T) {
	engine := NewDiscountEngine()

	// 1. Order with 10,000 KZT
	order := &models.Order{
		ID: "ORD-LOYALTY-1",
		Items: []models.OrderItem{
			{ID: "i1", Name: "Tomahawk Steak", Quantity: 1, UnitPrice: 10000.0},
		},
	}
	order.RecalculateTotal()

	// Apply Gold tier (10%) -> 1,000 KZT discount
	discount, err := engine.ApplyCustomerTier(order, "gold")
	if err != nil {
		t.Fatalf("unexpected error applying gold tier: %v", err)
	}
	if discount != 1000.0 {
		t.Errorf("expected 1000 discount, got %.2f", discount)
	}
	if order.TotalAmount != 9000.0 {
		t.Errorf("expected 9000 remaining, got %.2f", order.TotalAmount)
	}

	// 2. Happy hour test: 12:00 - 15:00 (15% discount)
	// Check inside window: 13:30
	lunchTime := time.Date(2026, 10, 2, 13, 30, 0, 0, time.UTC)
	hhDiscount, err := engine.ApplyHappyHour(order, 12, 15, 15.0, lunchTime)
	if err != nil {
		t.Fatalf("unexpected error applying happy hour: %v", err)
	}
	// 15% of gross 10,000 = 1500
	if hhDiscount != 1500.0 {
		t.Errorf("expected 1500 happy hour discount, got %.2f", hhDiscount)
	}

	// Total discount = 1000 + 1500 = 2500. Remaining = 7500
	if order.TotalAmount != 7500.0 {
		t.Errorf("expected 7500 net total, got %.2f", order.TotalAmount)
	}

	// Check outside window: 16:00 -> 0 discount
	dinnerTime := time.Date(2026, 10, 2, 16, 0, 0, 0, time.UTC)
	noDiscount, err := engine.ApplyHappyHour(order, 12, 15, 15.0, dinnerTime)
	if err != nil || noDiscount != 0 {
		t.Errorf("expected 0 discount outside happy hour window, got %.2f, err: %v", noDiscount, err)
	}
}

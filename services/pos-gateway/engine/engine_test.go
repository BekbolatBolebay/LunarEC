package engine

import (
	"math"
	"testing"

	"github.com/lunarec/pos-gateway/models"
)

func TestOrderStateMachine_Transitions(t *testing.T) {
	osm := NewOrderStateMachine()

	order := &models.Order{
		ID:          "ord-101",
		TableNumber: 4,
		Items: []models.OrderItem{
			{ID: "i1", Name: "Burger", Quantity: 2, UnitPrice: 3000, Station: models.StationGrill},
		},
	}

	osm.CreateOrder(order)

	// Draft -> SentToKitchen: OK
	if err := osm.Transition("ord-101", models.StatusSentToKitchen); err != nil {
		t.Fatalf("Transition to SentToKitchen failed: %v", err)
	}

	// SentToKitchen -> Cooking: OK
	if err := osm.Transition("ord-101", models.StatusCooking); err != nil {
		t.Fatalf("Transition to Cooking failed: %v", err)
	}

	// Cooking -> Paid (Invalid direct skip): Error expected
	if err := osm.Transition("ord-101", models.StatusPaid); err == nil {
		t.Fatalf("Expected invalid transition error from Cooking to Paid, but got none")
	}

	// Cooking -> ReadyToServe -> Served -> Paid: Valid progression
	if err := osm.Transition("ord-101", models.StatusReadyToServe); err != nil {
		t.Fatalf("Failed transition to ReadyToServe: %v", err)
	}
	if err := osm.Transition("ord-101", models.StatusServed); err != nil {
		t.Fatalf("Failed transition to Served: %v", err)
	}
	if err := osm.Transition("ord-101", models.StatusPaid); err != nil {
		t.Fatalf("Failed transition to Paid: %v", err)
	}
}

func TestBillSplitter_SplitEqually(t *testing.T) {
	splitter := NewBillSplitter()
	order := &models.Order{
		Items: []models.OrderItem{
			{Quantity: 2, UnitPrice: 5000}, // 10,000
			{Quantity: 1, UnitPrice: 2000}, // 2,000 -> 12,000 total
		},
	}

	res, err := splitter.SplitEqually(order, 3)
	if err != nil {
		t.Fatalf("SplitEqually returned error: %v", err)
	}

	if res.PerGuestAmount != 4000.0 {
		t.Errorf("Expected 4000 per guest, got %f", res.PerGuestAmount)
	}
	if len(res.GuestShares) != 3 {
		t.Errorf("Expected 3 guest shares, got %d", len(res.GuestShares))
	}
}

func TestBillSplitter_SplitWithRemainder(t *testing.T) {
	splitter := NewBillSplitter()
	order := &models.Order{
		Items: []models.OrderItem{
			{Quantity: 1, UnitPrice: 1000.0}, // 1000 KZT split among 3 guests -> 333.34, 333.33, 333.33
		},
	}

	res, err := splitter.SplitEqually(order, 3)
	if err != nil {
		t.Fatalf("SplitEqually returned error: %v", err)
	}

	sumShares := 0.0
	for _, share := range res.GuestShares {
		sumShares += share
	}

	// Floating point total must equal exactly 1000.0
	if math.Abs(sumShares-1000.0) > 0.001 {
		t.Errorf("Expected sum of guest shares to exactly equal 1000.0, got %f", sumShares)
	}
	if res.GuestShares[0] != 333.34 || res.GuestShares[1] != 333.33 || res.GuestShares[2] != 333.33 {
		t.Errorf("Unexpected individual shares: %v", res.GuestShares)
	}
}

func TestDiscountEngine_PromoAndLoyalty(t *testing.T) {
	de := NewDiscountEngine()
	de.RegisterPromo(&PromoRule{
		Code:           "SPRING20",
		Type:           DiscountPercent,
		Value:          20.0,
		MinOrderAmount: 1000.0,
		IsActive:       true,
	})
	de.RegisterPromo(&PromoRule{
		Code:     "VIPLOYALTY",
		Type:     DiscountLoyalty,
		Value:    15000.0, // higher than order total
		IsActive: true,
	})

	order := &models.Order{
		Items: []models.OrderItem{
			{Quantity: 2, UnitPrice: 3000.0}, // 6000 total
		},
	}

	// 1. Percentage promo
	discount, err := de.ApplyPromo(order, "spring20")
	if err != nil {
		t.Fatalf("unexpected error applying promo: %v", err)
	}
	if discount != 1200.0 {
		t.Errorf("expected 1200 discount, got %f", discount)
	}
	if order.TotalAmount != 4800.0 {
		t.Errorf("expected order total 4800, got %f", order.TotalAmount)
	}

	// 2. Loyalty discount capping
	loyaltyDiscount, err := de.ApplyPromo(order, "viployalty")
	if err != nil {
		t.Fatalf("unexpected error applying loyalty: %v", err)
	}
	if loyaltyDiscount != 4800.0 {
		t.Errorf("expected loyalty discount capped to 4800, got %f", loyaltyDiscount)
	}
	if order.TotalAmount != 0.0 {
		t.Errorf("expected order total to be 0, got %f", order.TotalAmount)
	}
}

func TestKDSRouter_DispatchOrder(t *testing.T) {
	router := NewKDSRouter()
	order := &models.Order{
		ID:          "ord-kds",
		TableNumber: 2,
		Items: []models.OrderItem{
			{Name: "Steak", Station: models.StationGrill},
			{Name: "Mojito", Station: models.StationBar},
		},
	}

	tickets := router.DispatchOrder(order)
	if len(tickets) != 2 {
		t.Errorf("Expected 2 separate station tickets (grill & bar), got %d", len(tickets))
	}
}

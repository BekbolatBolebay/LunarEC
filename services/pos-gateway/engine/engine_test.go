package engine

import (
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

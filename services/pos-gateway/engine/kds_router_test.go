package engine

import (
	"testing"
	"time"

	"github.com/lunarec/pos-gateway/models"
)

func TestKDSRouter_DispatchAndBump(t *testing.T) {
	router := NewKDSRouter()

	order := &models.Order{
		ID:          "ORD-101",
		TableNumber: 5,
		Items: []models.OrderItem{
			{ID: "i1", Name: "Ribeye Steak", Quantity: 1, Station: models.StationGrill},
			{ID: "i2", Name: "Caesar Salad", Quantity: 2, Station: models.StationCold},
			{ID: "i3", Name: "Mojito", Quantity: 2, Station: models.StationBar},
		},
	}

	tickets := router.DispatchOrder(order)
	if len(tickets) != 3 {
		t.Fatalf("expected 3 tickets for 3 stations, got %d", len(tickets))
	}

	grillQueue := router.GetStationQueue(models.StationGrill)
	if len(grillQueue) != 1 {
		t.Fatalf("expected 1 grill ticket, got %d", len(grillQueue))
	}

	ticket := grillQueue[0]
	if ticket.Status != TicketPending {
		t.Errorf("expected TicketPending, got %s", ticket.Status)
	}

	// Bump 1: Pending -> Cooking
	bumped, err := router.BumpTicket(ticket.TicketID)
	if err != nil {
		t.Fatalf("unexpected error bumping: %v", err)
	}
	if bumped.Status != TicketCooking {
		t.Errorf("expected TicketCooking, got %s", bumped.Status)
	}
	if bumped.StartedAt == nil {
		t.Errorf("expected StartedAt to be set")
	}

	// Bump 2: Cooking -> Ready
	bumped, err = router.BumpTicket(ticket.TicketID)
	if err != nil {
		t.Fatalf("unexpected error bumping to ready: %v", err)
	}
	if bumped.Status != TicketReady {
		t.Errorf("expected TicketReady, got %s", bumped.Status)
	}

	// Bump 3: Ready -> Completed
	bumped, err = router.BumpTicket(ticket.TicketID)
	if err != nil {
		t.Fatalf("unexpected error completing ticket: %v", err)
	}
	if bumped.Status != TicketCompleted {
		t.Errorf("expected TicketCompleted, got %s", bumped.Status)
	}

	// Active queue should now be empty for grill
	grillQueueAfter := router.GetStationQueue(models.StationGrill)
	if len(grillQueueAfter) != 0 {
		t.Errorf("expected 0 active grill tickets, got %d", len(grillQueueAfter))
	}

	// Recall ticket
	recalled, err := router.RecallTicket(ticket.TicketID)
	if err != nil {
		t.Fatalf("unexpected error recalling ticket: %v", err)
	}
	if recalled.Status != TicketCooking {
		t.Errorf("expected status to be recalled to TicketCooking, got %s", recalled.Status)
	}
}

func TestKDSRouter_UrgentEscalation(t *testing.T) {
	router := NewKDSRouter()
	router.SetUrgentDelay(10 * time.Millisecond)

	order := &models.Order{
		ID:          "ORD-102",
		TableNumber: 2,
		Items: []models.OrderItem{
			{ID: "i1", Name: "Espresso", Quantity: 1, Station: models.StationBar},
		},
	}

	router.DispatchOrder(order)
	time.Sleep(15 * time.Millisecond) // Trigger urgent threshold

	barQueue := router.GetStationQueue(models.StationBar)
	if len(barQueue) != 1 {
		t.Fatalf("expected 1 bar ticket, got %d", len(barQueue))
	}

	if !barQueue[0].IsUrgent {
		t.Errorf("expected ticket to be marked as urgent after delay")
	}
}

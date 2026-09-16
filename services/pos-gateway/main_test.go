package main

import (
	"testing"
)

func TestGatewayHub_UpdateTable(t *testing.T) {
	hub := NewGatewayHub()

	hub.UpdateTable(TableEvent{
		TableID:  5,
		Status:   "reserved",
		TotalDue: 25000.0,
	})

	table, exists := hub.GetTable(5)
	if !exists {
		t.Fatalf("Expected table 5 to exist, but it didn't")
	}

	if table.Status != "reserved" {
		t.Errorf("Expected status 'reserved', got '%s'", table.Status)
	}

	if table.TotalDue != 25000.0 {
		t.Errorf("Expected total due 25000, got %f", table.TotalDue)
	}
}

func TestGatewayHub_GetAllTables(t *testing.T) {
	hub := NewGatewayHub()
	hub.UpdateTable(TableEvent{TableID: 1, Status: "free"})
	hub.UpdateTable(TableEvent{TableID: 2, Status: "occupied"})

	all := hub.GetAllTables()
	if len(all) != 2 {
		t.Errorf("Expected 2 tables, got %d", len(all))
	}
}

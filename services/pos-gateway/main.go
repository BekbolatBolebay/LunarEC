package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type TableEvent struct {
	TableID   int       `json:"table_id"`
	Status    string    `json:"status"` // "free", "occupied", "reserved"
	Timestamp time.Time `json:"timestamp"`
	TotalDue  float64   `json:"total_due"`
}

type GatewayHub struct {
	mu     sync.RWMutex
	tables map[int]*TableEvent
}

func NewGatewayHub() *GatewayHub {
	return &GatewayHub{
		tables: make(map[int]*TableEvent),
	}
}

func (h *GatewayHub) UpdateTable(ev TableEvent) {
	h.mu.Lock()
	defer h.mu.Unlock()
	ev.Timestamp = time.Now()
	h.tables[ev.TableID] = &ev
}

func (h *GatewayHub) GetTable(id int) (*TableEvent, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	val, ok := h.tables[id]
	return val, ok
}

func (h *GatewayHub) GetAllTables() []*TableEvent {
	h.mu.RLock()
	defer h.mu.RUnlock()
	res := make([]*TableEvent, 0, len(h.tables))
	for _, v := range h.tables {
		res = append(res, v)
	}
	return res
}

func main() {
	fmt.Println("🐹 [LunarEC Go Gateway] POS Table Sync Service v0.1.0 starting on :8081...")
	hub := NewGatewayHub()

	// Initial table states
	hub.UpdateTable(TableEvent{TableID: 1, Status: "occupied", TotalDue: 14500})
	hub.UpdateTable(TableEvent{TableID: 2, Status: "free", TotalDue: 0})

	http.HandleFunc("/api/tables", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(hub.GetAllTables())
	})

	fmt.Println("✅ Go Service ready for events.")
}

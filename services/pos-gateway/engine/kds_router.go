package engine

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/lunarec/pos-gateway/models"
)

type TicketStatus string

const (
	TicketPending   TicketStatus = "pending"
	TicketCooking   TicketStatus = "cooking"
	TicketReady     TicketStatus = "ready"
	TicketCompleted TicketStatus = "completed"
)

type KitchenTicket struct {
	TicketID      string                `json:"ticket_id"`
	OrderID       string                `json:"order_id"`
	TableNumber   int                   `json:"table_number"`
	Station       models.KitchenStation `json:"station"`
	Items         []models.OrderItem    `json:"items"`
	Status        TicketStatus          `json:"status"`
	IsUrgent      bool                  `json:"is_urgent"`
	CreatedAt     time.Time             `json:"created_at"`
	StartedAt     *time.Time            `json:"started_at,omitempty"`
	CompletedAt   *time.Time            `json:"completed_at,omitempty"`
}

type KDSRouter struct {
	mu           sync.RWMutex
	tickets      map[string]*KitchenTicket
	stationQueue map[models.KitchenStation][]*KitchenTicket
	urgentDelay  time.Duration
}

func NewKDSRouter() *KDSRouter {
	return &KDSRouter{
		tickets:      make(map[string]*KitchenTicket),
		stationQueue: make(map[models.KitchenStation][]*KitchenTicket),
		urgentDelay:  15 * time.Minute,
	}
}

// SetUrgentDelay sets custom threshold for escalating ticket urgency
func (r *KDSRouter) SetUrgentDelay(d time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.urgentDelay = d
}

// DispatchOrder partitions order items by kitchen station and assigns unique tickets
func (r *KDSRouter) DispatchOrder(order *models.Order) []*KitchenTicket {
	r.mu.Lock()
	defer r.mu.Unlock()

	stationGroups := make(map[models.KitchenStation][]models.OrderItem)
	for _, it := range order.Items {
		stationGroups[it.Station] = append(stationGroups[it.Station], it)
	}

	dispatched := make([]*KitchenTicket, 0, len(stationGroups))
	now := time.Now()

	for st, items := range stationGroups {
		ticketID := fmt.Sprintf("KDS-%s-%s-%d", order.ID, string(st), now.UnixNano()%10000)
		ticket := &KitchenTicket{
			TicketID:    ticketID,
			OrderID:     order.ID,
			TableNumber: order.TableNumber,
			Station:     st,
			Items:       items,
			Status:      TicketPending,
			IsUrgent:    false,
			CreatedAt:   now,
		}

		r.tickets[ticketID] = ticket
		r.stationQueue[st] = append(r.stationQueue[st], ticket)
		dispatched = append(dispatched, ticket)
	}

	return dispatched
}

// BumpTicket advances ticket status (Pending -> Cooking -> Ready -> Completed)
func (r *KDSRouter) BumpTicket(ticketID string) (*KitchenTicket, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	t, exists := r.tickets[ticketID]
	if !exists {
		return nil, errors.New("асүй билеті табылмады")
	}

	now := time.Now()
	switch t.Status {
	case TicketPending:
		t.Status = TicketCooking
		t.StartedAt = &now
	case TicketCooking:
		t.Status = TicketReady
	case TicketReady:
		t.Status = TicketCompleted
		t.CompletedAt = &now
	case TicketCompleted:
		return t, errors.New("билет әлдеқашан аяқталған")
	}

	return t, nil
}

// RecallTicket moves completed or ready ticket back to cooking
func (r *KDSRouter) RecallTicket(ticketID string) (*KitchenTicket, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	t, exists := r.tickets[ticketID]
	if !exists {
		return nil, errors.New("асүй билеті табылмады")
	}

	if t.Status == TicketPending {
		return nil, errors.New("күтудегі билетті қайтару мүмкін емес")
	}

	t.Status = TicketCooking
	t.CompletedAt = nil
	return t, nil
}

// GetStationQueue returns tickets for a specific station, updating urgency if delayed
func (r *KDSRouter) GetStationQueue(station models.KitchenStation) []*KitchenTicket {
	r.mu.Lock()
	defer r.mu.Unlock()

	queue := r.stationQueue[station]
	now := time.Now()

	result := make([]*KitchenTicket, 0, len(queue))
	for _, t := range queue {
		if t.Status != TicketCompleted {
			if now.Sub(t.CreatedAt) > r.urgentDelay {
				t.IsUrgent = true
			}
			result = append(result, t)
		}
	}
	return result
}

// GetAllActiveTickets returns all non-completed tickets across all stations
func (r *KDSRouter) GetAllActiveTickets() []*KitchenTicket {
	r.mu.RLock()
	defer r.mu.RUnlock()

	active := make([]*KitchenTicket, 0, len(r.tickets))
	for _, t := range r.tickets {
		if t.Status != TicketCompleted {
			active = append(active, t)
		}
	}
	return active
}

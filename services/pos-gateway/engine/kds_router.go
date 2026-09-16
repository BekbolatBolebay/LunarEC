package engine

import (
	"sync"
	"time"

	"github.com/lunarec/pos-gateway/models"
)

type KitchenTicket struct {
	TicketID    string                `json:"ticket_id"`
	OrderID     string                `json:"order_id"`
	TableNumber int                   `json:"table_number"`
	Station     models.KitchenStation `json:"station"`
	Items       []models.OrderItem    `json:"items"`
	CreatedAt   time.Time             `json:"created_at"`
}

type KDSRouter struct {
	mu      sync.RWMutex
	tickets map[models.KitchenStation][]*KitchenTicket
}

func NewKDSRouter() *KDSRouter {
	return &KDSRouter{
		tickets: make(map[models.KitchenStation][]*KitchenTicket),
	}
}

func (r *KDSRouter) DispatchOrder(order *models.Order) []*KitchenTicket {
	r.mu.Lock()
	defer r.mu.Unlock()

	stationGroups := make(map[models.KitchenStation][]models.OrderItem)
	for _, it := range order.Items {
		stationGroups[it.Station] = append(stationGroups[it.Station], it)
	}

	dispatched := make([]*KitchenTicket, 0, len(stationGroups))
	for st, items := range stationGroups {
		ticket := &KitchenTicket{
			TicketID:    time.Now().Format("T-150405"),
			OrderID:     order.ID,
			TableNumber: order.TableNumber,
			Station:     st,
			Items:       items,
			CreatedAt:   time.Now(),
		}
		r.tickets[st] = append(r.tickets[st], ticket)
		dispatched = append(dispatched, ticket)
	}

	return dispatched
}

func (r *KDSRouter) GetStationQueue(station models.KitchenStation) []*KitchenTicket {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.tickets[station]
}

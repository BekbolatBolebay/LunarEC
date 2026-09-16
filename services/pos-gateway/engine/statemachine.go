package engine

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/lunarec/pos-gateway/models"
)

var (
	ErrInvalidTransition = errors.New("invalid order status transition")
	ErrOrderNotFound      = errors.New("order not found in state store")
)

type OrderStateMachine struct {
	mu     sync.RWMutex
	orders map[string]*models.Order
}

func NewOrderStateMachine() *OrderStateMachine {
	return &OrderStateMachine{
		orders: make(map[string]*models.Order),
	}
}

func (osm *OrderStateMachine) CreateOrder(order *models.Order) {
	osm.mu.Lock()
	defer osm.mu.Unlock()

	order.Status = models.StatusDraft
	order.CreatedAt = time.Now()
	order.RecalculateTotal()
	osm.orders[order.ID] = order
}

func (osm *OrderStateMachine) Transition(orderID string, target models.OrderStatus) error {
	osm.mu.Lock()
	defer osm.mu.Unlock()

	order, exists := osm.orders[orderID]
	if !exists {
		return ErrOrderNotFound
	}

	// State validation matrix
	current := order.Status
	switch current {
	case models.StatusDraft:
		if target != models.StatusSentToKitchen && target != models.StatusCancelled {
			return fmt.Errorf("%w: %s -> %s", ErrInvalidTransition, current, target)
		}
	case models.StatusSentToKitchen:
		if target != models.StatusCooking && target != models.StatusCancelled {
			return fmt.Errorf("%w: %s -> %s", ErrInvalidTransition, current, target)
		}
	case models.StatusCooking:
		if target != models.StatusReadyToServe {
			return fmt.Errorf("%w: %s -> %s", ErrInvalidTransition, current, target)
		}
	case models.StatusReadyToServe:
		if target != models.StatusServed {
			return fmt.Errorf("%w: %s -> %s", ErrInvalidTransition, current, target)
		}
	case models.StatusServed:
		if target != models.StatusPaid {
			return fmt.Errorf("%w: %s -> %s", ErrInvalidTransition, current, target)
		}
	case models.StatusPaid, models.StatusCancelled:
		return fmt.Errorf("%w: terminal state cannot transition", ErrInvalidTransition)
	}

	order.Status = target
	order.UpdatedAt = time.Now()
	return nil
}

func (osm *OrderStateMachine) GetOrder(id string) (*models.Order, error) {
	osm.mu.RLock()
	defer osm.mu.RUnlock()

	ord, exists := osm.orders[id]
	if !exists {
		return nil, ErrOrderNotFound
	}
	return ord, nil
}

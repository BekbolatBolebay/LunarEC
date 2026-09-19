package engine

import (
	"sync"
	"time"
)

// AlertSeverity defines urgency level
type AlertSeverity string

const (
	SeverityNormal   AlertSeverity = "NORMAL"
	SeverityWarning  AlertSeverity = "WARNING"  // > 10 mins
	SeverityCritical AlertSeverity = "CRITICAL" // > 15 mins
)

// KitchenDelayAlert represents an alert dispatched to kitchen/waiter
type KitchenDelayAlert struct {
	OrderID     string        `json:"order_id"`
	TableNumber string        `json:"table_number"`
	ElapsedTime time.Duration `json:"elapsed_time"`
	Severity    AlertSeverity `json:"severity"`
	Message     string        `json:"message"`
	DispatchedAt time.Time    `json:"dispatched_at"`
}

// KitchenAlertDispatcher monitors pending kitchen orders and flags delays
type KitchenAlertDispatcher struct {
	mu           sync.RWMutex
	warningLimit time.Duration
	critLimit    time.Duration
	alerts       []KitchenDelayAlert
}

// NewKitchenAlertDispatcher creates a new dispatcher with thresholds
func NewKitchenAlertDispatcher(warningLimit, critLimit time.Duration) *KitchenAlertDispatcher {
	return &KitchenAlertDispatcher{
		warningLimit: warningLimit,
		critLimit:    critLimit,
		alerts:       make([]KitchenDelayAlert, 0),
	}
}

// EvaluateOrderDelay checks an order against cooking duration
func (kad *KitchenAlertDispatcher) EvaluateOrderDelay(orderID, tableNo string, createdAt time.Time) *KitchenDelayAlert {
	kad.mu.Lock()
	defer kad.mu.Unlock()

	elapsed := time.Since(createdAt)
	if elapsed < kad.warningLimit {
		return nil
	}

	severity := SeverityWarning
	msg := "⚠️ Тапсырыс дайындалу уақыты созылуда (10+ мин)"

	if elapsed >= kad.critLimit {
		severity = SeverityCritical
		msg = "🚨 КҮРДЕЛІ КІДІРІС: Тапсырыс 15+ минуттан бері дайын емес!"
	}

	alert := KitchenDelayAlert{
		OrderID:      orderID,
		TableNumber:  tableNo,
		ElapsedTime:  elapsed,
		Severity:     severity,
		Message:      msg,
		DispatchedAt: time.Now(),
	}

	kad.alerts = append(kad.alerts, alert)
	return &alert
}

// GetRecentAlerts returns historical alerts
func (kad *KitchenAlertDispatcher) GetRecentAlerts() []KitchenDelayAlert {
	kad.mu.RLock()
	defer kad.mu.RUnlock()
	return kad.alerts
}

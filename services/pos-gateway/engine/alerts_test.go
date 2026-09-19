package engine

import (
	"testing"
	"time"
)

func TestKitchenAlertDispatcher(t *testing.T) {
	dispatcher := NewKitchenAlertDispatcher(10*time.Minute, 15*time.Minute)

	// Case 1: Fresh order (5 mins) -> No alert
	freshOrder := time.Now().Add(-5 * time.Minute)
	alert := dispatcher.EvaluateOrderDelay("ORD-1", "Table 4", freshOrder)
	if alert != nil {
		t.Errorf("expected no alert for 5m order, got %+v", alert)
	}

	// Case 2: Warning order (11 mins) -> WARNING alert
	warningOrder := time.Now().Add(-11 * time.Minute)
	alert = dispatcher.EvaluateOrderDelay("ORD-2", "Table 8", warningOrder)
	if alert == nil || alert.Severity != SeverityWarning {
		t.Errorf("expected WARNING alert for 11m order, got %+v", alert)
	}

	// Case 3: Critical order (18 mins) -> CRITICAL alert
	critOrder := time.Now().Add(-18 * time.Minute)
	alert = dispatcher.EvaluateOrderDelay("ORD-3", "Table 12", critOrder)
	if alert == nil || alert.Severity != SeverityCritical {
		t.Errorf("expected CRITICAL alert for 18m order, got %+v", alert)
	}

	history := dispatcher.GetRecentAlerts()
	if len(history) != 2 {
		t.Errorf("expected 2 alerts in history, got %d", len(history))
	}
}

package engine

import (
	"testing"
	"time"
)

func TestPOSMetricsAccumulator(t *testing.T) {
	acc := NewPOSMetricsAccumulator()

	now := time.Date(2026, 9, 18, 14, 30, 0, 0, time.UTC) // 14:30
	acc.RecordCompletedOrder(now, 4500.0, 300*time.Second)  // 5 min prep
	acc.RecordCompletedOrder(now, 6500.0, 420*time.Second)  // 7 min prep

	snapshot := acc.GetHourlySnapshot()
	if len(snapshot) != 24 {
		t.Fatalf("expected 24 hours in snapshot, got %d", len(snapshot))
	}

	h14 := snapshot[14]
	if h14.OrderCount != 2 {
		t.Errorf("expected 2 orders in hour 14, got %d", h14.OrderCount)
	}
	if h14.TotalRevenue != 11000.0 {
		t.Errorf("expected 11000.0 revenue, got %f", h14.TotalRevenue)
	}
	if h14.AveragePrepSec != 360.0 {
		t.Errorf("expected 360s average prep, got %f", h14.AveragePrepSec)
	}

	orders, rev := acc.GetTotalSummary()
	if orders != 2 || rev != 11000.0 {
		t.Errorf("expected total (2, 11000), got (%d, %f)", orders, rev)
	}
}

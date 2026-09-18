package engine

import (
	"sync"
	"time"
)

// POSHourlyMetric holds throughput stats for a given hour
type POSHourlyMetric struct {
	Hour           int     `json:"hour"`
	OrderCount     int     `json:"order_count"`
	TotalRevenue   float64 `json:"total_revenue"`
	AveragePrepSec float64 `json:"avg_prep_sec"`
}

// POSMetricsAccumulator computes real-time POS stream performance
type POSMetricsAccumulator struct {
	mu           sync.RWMutex
	hourlyData   map[int]*POSHourlyMetric
	totalOrders  int
	totalRevenue float64
}

// NewPOSMetricsAccumulator initializes the metrics accumulator
func NewPOSMetricsAccumulator() *POSMetricsAccumulator {
	acc := &POSMetricsAccumulator{
		hourlyData: make(map[int]*POSHourlyMetric),
	}
	// Pre-fill 24 hours
	for h := 0; h < 24; h++ {
		acc.hourlyData[h] = &POSHourlyMetric{
			Hour:           h,
			OrderCount:     0,
			TotalRevenue:   0,
			AveragePrepSec: 0,
		}
	}
	return acc
}

// RecordCompletedOrder records an order completion with its timestamp
func (acc *POSMetricsAccumulator) RecordCompletedOrder(t time.Time, amount float64, prepDuration time.Duration) {
	acc.mu.Lock()
	defer acc.mu.Unlock()

	hour := t.Hour()
	metric := acc.hourlyData[hour]
	if metric == nil {
		metric = &POSHourlyMetric{Hour: hour}
		acc.hourlyData[hour] = metric
	}

	prepSec := prepDuration.Seconds()
	currentTotalPrep := metric.AveragePrepSec * float64(metric.OrderCount)
	metric.OrderCount++
	metric.TotalRevenue += amount
	metric.AveragePrepSec = (currentTotalPrep + prepSec) / float64(metric.OrderCount)

	acc.totalOrders++
	acc.totalRevenue += amount
}

// GetHourlySnapshot returns a 24-hour array of metrics
func (acc *POSMetricsAccumulator) GetHourlySnapshot() []POSHourlyMetric {
	acc.mu.RLock()
	defer acc.mu.RUnlock()

	snapshot := make([]POSHourlyMetric, 24)
	for h := 0; h < 24; h++ {
		if m, exists := acc.hourlyData[h]; exists {
			snapshot[h] = *m
		} else {
			snapshot[h] = POSHourlyMetric{Hour: h}
		}
	}
	return snapshot
}

// GetTotalSummary returns overall counts
func (acc *POSMetricsAccumulator) GetTotalSummary() (int, float64) {
	acc.mu.RLock()
	defer acc.mu.RUnlock()
	return acc.totalOrders, acc.totalRevenue
}

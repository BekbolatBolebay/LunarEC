package analytics

type HourlyMetric struct {
	Hour int
	CheckCount int
	TotalSales float64
}

func SuggestCashierCount(checksPerHour int) int {
	if checksPerHour > 60 {
		return 3
	} else if checksPerHour > 25 {
		return 2
	}
	return 1
}

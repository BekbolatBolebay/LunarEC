package analytics

func CalculateOTIF(onTimeInFullOrders, totalOrders int) float64 {
	if totalOrders == 0 {
		return 100.0
	}
	return (float64(onTimeInFullOrders) / float64(totalOrders)) * 100.0
}

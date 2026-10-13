package crm

type CustomerRFM struct {
	CustomerID string
	RecencyDays int
	FrequencyCount int
	MonetaryTotal float64
}

func AssignRFMTier(rfm CustomerRFM) string {
	if rfm.MonetaryTotal > 500000 && rfm.FrequencyCount > 10 {
		return "VIP_PLATINUM"
	} else if rfm.RecencyDays < 30 && rfm.FrequencyCount > 3 {
		return "ACTIVE_REGULAR"
	} else if rfm.RecencyDays > 90 {
		return "AT_RISK"
	}
	return "STANDARD"
}

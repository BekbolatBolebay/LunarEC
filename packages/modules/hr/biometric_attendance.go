package hr

func CalculateTardinessMinutes(scheduledStartUnix, actualScanUnix int64) int64 {
	if actualScanUnix > scheduledStartUnix {
		return (actualScanUnix - scheduledStartUnix) / 60
	}
	return 0
}

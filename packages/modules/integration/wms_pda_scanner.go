package integration

type ScannedBarcodeEvent struct {
	Barcode   string
	ScannerID string
	Timestamp int64
}

func ProcessScannedItem(event ScannedBarcodeEvent) bool {
	return len(event.Barcode) > 0 && len(event.ScannerID) > 0
}

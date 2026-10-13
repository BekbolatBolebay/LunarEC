package tax

type SNTRecord struct {
	SNTNumber      string
	SenderBIN      string
	RecipientBIN   string
	VirtualStockID string
	ProductCode    string
	Quantity       float64
	Status         string // "DRAFT", "REGISTERED", "CONFIRMED"
}

func RegisterSNT(snt *SNTRecord) bool {
	if snt.SenderBIN == "" || snt.RecipientBIN == "" || snt.Quantity <= 0 {
		return false
	}
	snt.Status = "CONFIRMED"
	return true
}

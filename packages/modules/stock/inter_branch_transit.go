package stock

type StockTransferDoc struct {
	DocID        string
	FromWH       string
	ToWH         string
	SentQty      float64
	ReceivedQty  float64
	LossQty      float64
	IsCompleted  bool
}

func ConfirmTransferReceiving(doc *StockTransferDoc, receivedQty float64) {
	doc.ReceivedQty = receivedQty
	doc.LossQty = doc.SentQty - receivedQty
	doc.IsCompleted = true
}

package engine

import (
	"fmt"
	"strings"
)

type ReceiptItem struct {
	Name  string
	Qty   int
	Price float64
}

func FormatReceipt(orderID, table string, items []ReceiptItem, total float64) string {
	var b strings.Builder
	b.WriteString("================================\n")
	b.WriteString("       🌙 LUNAR EC POS\n")
	b.WriteString(fmt.Sprintf(" Order: %s | Table: %s\n", orderID, table))
	b.WriteString("--------------------------------\n")
	for _, it := range items {
		b.WriteString(fmt.Sprintf(" %-18s x%d %8.0f ₸\n", it.Name, it.Qty, it.Price*float64(it.Qty)))
	}
	b.WriteString("--------------------------------\n")
	b.WriteString(fmt.Sprintf(" TOTAL: %20.0f ₸\n", total))
	b.WriteString("================================\n")
	return b.String()
}

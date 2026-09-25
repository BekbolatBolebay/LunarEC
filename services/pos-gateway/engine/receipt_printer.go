package engine

import (
	"fmt"
	"strings"
	"time"
)

type ReceiptItem struct {
	Name     string
	Quantity float64
	PriceKZT int64
}

type Receipt struct {
	StoreName string
	Cashier   string
	Timestamp time.Time
	Items     []ReceiptItem
}

func (r *Receipt) FormatText() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("=== %s ===\n", r.StoreName))
	sb.WriteString(fmt.Sprintf("Time: %s | Cashier: %s\n", r.Timestamp.Format("2006-01-02 15:04"), r.Cashier))
	sb.WriteString("----------------------------------------\n")
	var total int64
	for _, it := range r.Items {
		itemTotal := int64(it.Quantity * float64(it.PriceKZT))
		total += itemTotal
		sb.WriteString(fmt.Sprintf("%-20s x%.1f %d KZT\n", it.Name, it.Quantity, itemTotal))
	}
	sb.WriteString("----------------------------------------\n")
	sb.WriteString(fmt.Sprintf("TOTAL: %d KZT\n", total))
	return sb.String()
}

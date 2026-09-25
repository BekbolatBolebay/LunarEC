package engine

import (
	"strings"
	"testing"
	"time"
)

func TestReceiptFormatText(t *testing.T) {
	receipt := Receipt{
		StoreName: "Lunar POS Almaty",
		Cashier:   "Amina",
		Timestamp: time.Date(2026, 9, 25, 14, 0, 0, 0, time.UTC),
		Items: []ReceiptItem{
			{Name: "Espresso", Quantity: 2.0, PriceKZT: 900},
			{Name: "Croissant", Quantity: 1.0, PriceKZT: 1200},
		},
	}

	text := receipt.FormatText()
	if !strings.Contains(text, "TOTAL: 3000 KZT") {
		t.Errorf("expected total 3000 KZT, got:\n%s", text)
	}
	if !strings.Contains(text, "Lunar POS Almaty") {
		t.Errorf("expected store name in receipt")
	}
}

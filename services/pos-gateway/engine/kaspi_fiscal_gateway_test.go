package engine

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"testing"
)

func TestKaspiFiscalGateway_GenerateDynamicQR(t *testing.T) {
	gw := NewKaspiFiscalGateway("LunarCoffeeAlmaty", "kaspi_secret_key_777", "010188992200", "990101350123")

	payload, err := gw.GenerateDynamicQR("ORD-5541", 3500, 15)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !strings.Contains(payload.QRString, "https://kaspi.kz/pay/LunarCoffeeAlmaty") {
		t.Errorf("expected URL to have merchant ID, got %s", payload.QRString)
	}
	if !strings.Contains(payload.QRString, "amount=3500") {
		t.Errorf("expected amount 3500, got %s", payload.QRString)
	}
}

func TestKaspiFiscalGateway_ProcessAndFiscalize(t *testing.T) {
	secret := "kaspi_secret_key_777"
	gw := NewKaspiFiscalGateway("LunarCoffeeAlmaty", secret, "010188992200", "990101350123")

	txnID := "TXN-998822"
	orderID := "ORD-5541"
	amountKZT := int64(3500)

	// Calculate valid HMAC-SHA256 signature
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(fmt.Sprintf("%s:%s:%d", txnID, orderID, amountKZT)))
	validSig := hex.EncodeToString(mac.Sum(nil))

	items := []ReceiptItem{
		{Name: "Flat White", Quantity: 2.0, PriceKZT: 1200},
		{Name: "Cheesecake", Quantity: 1.0, PriceKZT: 1100},
	}

	result, err := gw.ProcessAndFiscalize(txnID, orderID, amountKZT, validSig, items)
	if err != nil {
		t.Fatalf("failed to process and fiscalize: %v", err)
	}

	if result.PaymentMethod != "KASPI_QR" {
		t.Errorf("expected KASPI_QR, got %s", result.PaymentMethod)
	}
	if result.FiscalResult == nil || !result.FiscalResult.IsCompliant {
		t.Errorf("expected compliant fiscal result")
	}
	if len(result.FiscalResult.FiscalSign) != 10 {
		t.Errorf("expected 10-char fiscal sign, got %s", result.FiscalResult.FiscalSign)
	}
	if !strings.Contains(result.ReceiptText, "ОФД ФИСКАЛДЫ ЧЕК") {
		t.Errorf("expected receipt text to contain OFD fiscal block, got:\n%s", result.ReceiptText)
	}
}

func TestKaspiFiscalGateway_TamperedSignatureRejected(t *testing.T) {
	gw := NewKaspiFiscalGateway("LunarCoffeeAlmaty", "kaspi_secret_key_777", "010188992200", "990101350123")

	_, err := gw.ProcessAndFiscalize("TXN-1", "ORD-1", 1000, "invalid_tampered_sig", nil)
	if err == nil {
		t.Errorf("expected error for tampered signature, got nil")
	}
}

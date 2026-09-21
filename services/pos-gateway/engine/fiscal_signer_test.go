package engine

import (
	"testing"
	"time"
)

func TestFiscalSigner_SignReceipt(t *testing.T) {
	signer := NewFiscalSigner("my_test_secret_key_123", "https://consumer.oofd.kz/verify")

	receipt := &FiscalReceipt{
		ReceiptNumber: "REC-2026-0091",
		CashboxRNM:    "010188992200",
		OperatorIIN:   "990101350123",
		TotalAmount:   4500.50,
		VATAmount:     540.06,
		Timestamp:     time.Date(2026, 9, 21, 11, 40, 0, 0, time.UTC),
		OfflineMode:   false,
	}

	result, err := signer.SignReceipt(receipt, 104)
	if err != nil {
		t.Fatalf("unexpected error signing receipt: %v", err)
	}

	if !result.IsCompliant {
		t.Errorf("expected result to be compliant")
	}

	if len(result.FiscalSign) != 10 {
		t.Errorf("expected 10-char fiscal sign, got: %s (len: %d)", result.FiscalSign, len(result.FiscalSign))
	}

	if result.FiscalDocNumber != 104 {
		t.Errorf("expected doc number 104, got %d", result.FiscalDocNumber)
	}

	if result.VerificationURL == "" {
		t.Errorf("expected non-empty verification URL")
	}
}

func TestFiscalSigner_InvalidReceipt(t *testing.T) {
	signer := NewFiscalSigner("", "")

	invalidReceipt := &FiscalReceipt{
		CashboxRNM:  "", // missing RNM
		TotalAmount: 100.0,
	}

	_, err := signer.SignReceipt(invalidReceipt, 1)
	if err == nil {
		t.Errorf("expected error for empty CashboxRNM, got nil")
	}
}

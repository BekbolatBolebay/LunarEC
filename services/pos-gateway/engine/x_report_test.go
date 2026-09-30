package engine

import (
	"strings"
	"testing"
	"time"
)

func TestShiftManager_XReportAndZReport(t *testing.T) {
	signer := NewFiscalSigner("secret_key_123", "https://consumer.oofd.kz/verify")
	manager := NewShiftManager("010188992200", "990101350123", signer)
	manager.OpeningCash = 15000.0 // 15,000 KZT opening cash

	now := time.Now().UTC()

	// 1. Record Sale Cash: 5,000
	err := manager.RecordTransaction(ShiftTransaction{
		ID:        "TX-1",
		ReceiptNo: "R-001",
		IsReturn:  false,
		Tender:    TenderCash,
		AmountKZT: 5000.0,
		Timestamp: now,
	})
	if err != nil {
		t.Fatalf("failed to record tx1: %v", err)
	}

	// 2. Record Sale Kaspi QR: 12,000
	err = manager.RecordTransaction(ShiftTransaction{
		ID:        "TX-2",
		ReceiptNo: "R-002",
		IsReturn:  false,
		Tender:    TenderKaspiQR,
		AmountKZT: 12000.0,
		Timestamp: now,
	})
	if err != nil {
		t.Fatalf("failed to record tx2: %v", err)
	}

	// 3. Record Return Cash: 2,000
	err = manager.RecordTransaction(ShiftTransaction{
		ID:        "TX-3",
		ReceiptNo: "R-003",
		IsReturn:  true,
		Tender:    TenderCash,
		AmountKZT: 2000.0,
		Timestamp: now,
	})
	if err != nil {
		t.Fatalf("failed to record tx3: %v", err)
	}

	// 4. Generate X-Report
	xReport, err := manager.GenerateXReport()
	if err != nil {
		t.Fatalf("failed to generate X-report: %v", err)
	}

	if xReport.TotalSalesKZT != 17000.0 {
		t.Errorf("expected 17000 total sales, got %.2f", xReport.TotalSalesKZT)
	}
	if xReport.TotalReturnsKZT != 2000.0 {
		t.Errorf("expected 2000 total returns, got %.2f", xReport.TotalReturnsKZT)
	}
	if xReport.NetRevenueKZT != 15000.0 {
		t.Errorf("expected 15000 net revenue, got %.2f", xReport.NetRevenueKZT)
	}
	// Opening cash 15,000 + Cash sales 5,000 - Cash return 2,000 = 18,000 KZT in drawer
	if xReport.CashInDrawer != 18000.0 {
		t.Errorf("expected 18000 cash in drawer, got %.2f", xReport.CashInDrawer)
	}
	if xReport.ByTender[TenderKaspiQR] != 12000.0 {
		t.Errorf("expected 12000 in Kaspi QR, got %.2f", xReport.ByTender[TenderKaspiQR])
	}

	text := xReport.FormatXReportText()
	if !strings.Contains(text, "Х-ЕСЕП (АУЫСЫМДЫҚ)") {
		t.Errorf("expected header in formatted text")
	}

	// 5. Close Z-Report
	zReport, err := manager.CloseZReport()
	if err != nil {
		t.Fatalf("failed to close Z-report: %v", err)
	}

	if !zReport.IsShiftClosed {
		t.Errorf("expected shift to be closed")
	}
	if zReport.FiscalResult == nil || len(zReport.FiscalResult.FiscalSign) != 10 {
		t.Errorf("expected valid 10-char fiscal mark on Z-report")
	}

	// Attempting to record transaction on closed shift should fail
	err = manager.RecordTransaction(ShiftTransaction{
		ID:        "TX-4",
		ReceiptNo: "R-004",
		Tender:    TenderCash,
		AmountKZT: 1000.0,
		Timestamp: now,
	})
	if err == nil {
		t.Errorf("expected error when recording on closed shift")
	}
}

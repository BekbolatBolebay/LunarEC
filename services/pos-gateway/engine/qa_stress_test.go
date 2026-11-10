package engine

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/lunarec/pos-gateway/models"
)

// QA-TEST-001: 100 кассалық терминалдан бір мезетте келген параллельді транзакцияларды стресс-тестілеу
func TestQA_ConcurrentKaspiFiscalTransactions(t *testing.T) {
	secretKey := "TEST_KASPI_SECRET_KEY_KZ_2026"
	gateway := NewKaspiFiscalGateway("MERCHANT_LUNAR_KZ", secretKey, "RNM_ALMATY_001", "900101300200")
	var wg sync.WaitGroup
	concurrentRequests := 100
	successCount := 0
	var mu sync.Mutex

	for i := 0; i < concurrentRequests; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			orderID := fmt.Sprintf("ORD-2026-QA-%04d", id)
			amountKZT := int64(15000)

			// 1. Динамикалық QR жасау
			qr, err := gateway.GenerateDynamicQR(orderID, amountKZT, 15)
			if err != nil || qr == nil || qr.QRString == "" {
				t.Errorf("Параллельді QR генерация қатесі: id=%d, err=%v", id, err)
				return
			}

			// 2. Kaspi Webhook HMAC қолтаңбасын модельдеу
			txnID := fmt.Sprintf("TXN-KASPI-%04d", id)
			mac := hmac.New(sha256.New, []byte(secretKey))
			mac.Write([]byte(fmt.Sprintf("%s:%s:%d", txnID, orderID, amountKZT)))
			validSignature := hex.EncodeToString(mac.Sum(nil))

			// 3. Фискалдау және ОФД қолтаңбасын алу
			items := []ReceiptItem{
				{Name: "Ноутбук бизнес ThinkPad", Quantity: 1.0, PriceKZT: amountKZT},
			}
			txn, err := gateway.ProcessAndFiscalize(txnID, orderID, amountKZT, validSignature, items)
			if err != nil || txn == nil || txn.FiscalResult == nil {
				t.Errorf("ОФД фискалдау қатесі: id=%d, err=%v", id, err)
				return
			}

			if txn.FiscalResult.FiscalSign == "" || !txn.FiscalResult.IsCompliant {
				t.Errorf("Фискалды қолтаңба генерацияланбады немесе сәйкес емес: id=%d", id)
				return
			}

			mu.Lock()
			successCount++
			mu.Unlock()
		}(i)
	}

	wg.Wait()
	if successCount != concurrentRequests {
		t.Fatalf("Стресс-сынақтан өтпеді: %d / %d сәтті өтті", successCount, concurrentRequests)
	}
}

// QA-TEST-002: KDS асүй дисплейіндегі уақыт лимиті мен кідіріс эскалациясын тексеру
func TestQA_KDSTimeoutAndEscalation(t *testing.T) {
	router := NewKDSRouter()
	router.SetUrgentDelay(10 * time.Millisecond)

	order := &models.Order{
		ID:          "ORD-QA-KDS-01",
		TableNumber: 12,
		Items: []models.OrderItem{
			{ID: "i1", Name: "Стейк Рибай Medium", Quantity: 2, Station: models.StationGrill},
		},
	}

	tickets := router.DispatchOrder(order)
	if len(tickets) != 1 {
		t.Fatalf("Күтілген 1 асүй билеті, алынды: %d", len(tickets))
	}

	time.Sleep(15 * time.Millisecond) // Эскалация шегін шақыру

	grillQueue := router.GetStationQueue(models.StationGrill)
	if len(grillQueue) != 1 {
		t.Fatalf("Күтілген 1 гриль билеті, алынды: %d", len(grillQueue))
	}

	if !grillQueue[0].IsUrgent {
		t.Fatalf("15 миллисекундтан асқан тапсырыс IsUrgent = true күйіне ауыспады!")
	}
}

// QA-TEST-003: Х-есептегі салықтық баланс, қайтарулар және 12% ҚҚС аудит сынағы
func TestQA_FiscalXReportTaxAudit(t *testing.T) {
	signer := NewFiscalSigner("SECRET_AUDIT_2026", "https://consumer.oofd.kz/verify")
	manager := NewShiftManager("RNM_TEST_ALMATY_01", "850101300400", signer)

	// Сатылымдарды тіркеу
	err := manager.RecordTransaction(ShiftTransaction{
		ID:        "TX-001",
		ReceiptNo: "REC-001",
		IsReturn:  false,
		Tender:    TenderCash,
		AmountKZT: 10000.0,
		VATAmount: 10000.0 * 0.12 / 1.12,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("Транзакция қатесі: %v", err)
	}

	err = manager.RecordTransaction(ShiftTransaction{
		ID:        "TX-002",
		ReceiptNo: "REC-002",
		IsReturn:  false,
		Tender:    TenderKaspiQR,
		AmountKZT: 25000.0,
		VATAmount: 25000.0 * 0.12 / 1.12,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("Транзакция қатесі: %v", err)
	}

	err = manager.RecordTransaction(ShiftTransaction{
		ID:        "TX-003",
		ReceiptNo: "REC-003",
		IsReturn:  false,
		Tender:    TenderCard,
		AmountKZT: 15000.0,
		VATAmount: 15000.0 * 0.12 / 1.12,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("Транзакция қатесі: %v", err)
	}

	// 5000 KZT қайтару (Refund)
	err = manager.RecordTransaction(ShiftTransaction{
		ID:        "TX-004",
		ReceiptNo: "REF-001",
		IsReturn:  true,
		Tender:    TenderCash,
		AmountKZT: 5000.0,
		VATAmount: 5000.0 * 0.12 / 1.12,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("Қайтару қатесі: %v", err)
	}

	xReport, err := manager.GenerateXReport()
	if err != nil {
		t.Fatalf("X-есеп алу қатесі: %v", err)
	}

	if xReport.TotalSalesKZT != 50000.0 {
		t.Fatalf("Күтілген жалпы сатылым 50000.0, алынды: %f", xReport.TotalSalesKZT)
	}
	if xReport.TotalReturnsKZT != 5000.0 {
		t.Fatalf("Күтілген қайтару 5000.0, алынды: %f", xReport.TotalReturnsKZT)
	}
	if xReport.NetRevenueKZT != 45000.0 {
		t.Fatalf("Күтілген таза түсім 45000.0, алынды: %f", xReport.NetRevenueKZT)
	}
	if xReport.SalesCount != 3 {
		t.Fatalf("Сатылымдар саны 3 болуы тиіс, алынды: %d", xReport.SalesCount)
	}
	if xReport.ReturnsCount != 1 {
		t.Fatalf("Қайтарулар саны 1 болуы тиіс, алынды: %d", xReport.ReturnsCount)
	}
}

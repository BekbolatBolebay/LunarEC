package engine

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

// PaymentTender represents the payment method compliant with OFD standards
type PaymentTender string

const (
	TenderCash    PaymentTender = "CASH"
	TenderKaspiQR PaymentTender = "KASPI_QR"
	TenderCard    PaymentTender = "CARD"
)

// ShiftTransaction records an individual sale or return within an open shift
type ShiftTransaction struct {
	ID        string        `json:"id"`
	ReceiptNo string        `json:"receipt_no"`
	IsReturn  bool          `json:"is_return"`
	Tender    PaymentTender `json:"tender"`
	AmountKZT float64       `json:"amount_kzt"`
	VATAmount float64       `json:"vat_amount"`
	Timestamp time.Time     `json:"timestamp"`
}

// XReportSummary represents intermediate non-resetting shift audit
type XReportSummary struct {
	ShiftNumber     int64              `json:"shift_number"`
	CashboxRNM      string             `json:"cashbox_rnm"`
	CashierIIN      string             `json:"cashier_iin"`
	OpenedAt        time.Time          `json:"opened_at"`
	GeneratedAt     time.Time          `json:"generated_at"`
	TotalSalesKZT   float64            `json:"total_sales_kzt"`
	TotalReturnsKZT float64            `json:"total_returns_kzt"`
	NetRevenueKZT   float64            `json:"net_revenue_kzt"`
	TotalVATKZT     float64            `json:"total_vat_kzt"`
	SalesCount      int                `json:"sales_count"`
	ReturnsCount    int                `json:"returns_count"`
	CashInDrawer    float64            `json:"cash_in_drawer"`
	ByTender        map[PaymentTender]float64 `json:"by_tender"`
}

// ZReportResult represents final fiscal shift closure with cryptographic mark
type ZReportResult struct {
	Summary       *XReportSummary        `json:"summary"`
	ClosedAt      time.Time              `json:"closed_at"`
	FiscalResult  *FiscalSignatureResult `json:"fiscal_result"`
	IsShiftClosed bool                   `json:"is_shift_closed"`
}

// ShiftManager manages online KKM shift registers
type ShiftManager struct {
	mu           sync.RWMutex
	CashboxRNM   string
	CashierIIN   string
	ShiftNumber  int64
	OpenedAt     time.Time
	IsOpen       bool
	Transactions []ShiftTransaction
	FiscalSigner *FiscalSigner
	OpeningCash  float64
}

func NewShiftManager(cashboxRNM, cashierIIN string, signer *FiscalSigner) *ShiftManager {
	return &ShiftManager{
		CashboxRNM:   cashboxRNM,
		CashierIIN:   cashierIIN,
		ShiftNumber:  1,
		OpenedAt:     time.Now().UTC(),
		IsOpen:       true,
		FiscalSigner: signer,
		OpeningCash:  0,
	}
}

// OpenShift opens a new cashier work shift
func (m *ShiftManager) OpenShift(openingCash float64) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.IsOpen {
		return errors.New("ауысым әлдеқашан ашық")
	}

	m.ShiftNumber++
	m.OpenedAt = time.Now().UTC()
	m.IsOpen = true
	m.Transactions = nil
	m.OpeningCash = openingCash
	return nil
}

// RecordTransaction adds a verified sale or return
func (m *ShiftManager) RecordTransaction(tx ShiftTransaction) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.IsOpen {
		return errors.New("ауысым жабық, транзакцияны тіркеу мүмкін емес")
	}
	if tx.AmountKZT <= 0 {
		return errors.New("сома 0-ден жоғары болуы тиіс")
	}

	if tx.VATAmount == 0 {
		tx.VATAmount = tx.AmountKZT * 0.12 / 1.12 // 12% ҚҚС
	}

	m.Transactions = append(m.Transactions, tx)
	return nil
}

// GenerateXReport generates non-resetting shift audit
func (m *ShiftManager) GenerateXReport() (*XReportSummary, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if !m.IsOpen {
		return nil, errors.New("ауысым жабық")
	}

	byTender := map[PaymentTender]float64{
		TenderCash:    0,
		TenderKaspiQR: 0,
		TenderCard:    0,
	}

	var totalSales, totalReturns, totalVAT float64
	var salesCount, returnsCount int

	for _, tx := range m.Transactions {
		if tx.IsReturn {
			totalReturns += tx.AmountKZT
			returnsCount++
			byTender[tx.Tender] -= tx.AmountKZT
		} else {
			totalSales += tx.AmountKZT
			salesCount++
			byTender[tx.Tender] += tx.AmountKZT
		}
		totalVAT += tx.VATAmount
	}

	netRevenue := totalSales - totalReturns
	cashInDrawer := m.OpeningCash + byTender[TenderCash]

	return &XReportSummary{
		ShiftNumber:     m.ShiftNumber,
		CashboxRNM:      m.CashboxRNM,
		CashierIIN:      m.CashierIIN,
		OpenedAt:        m.OpenedAt,
		GeneratedAt:     time.Now().UTC(),
		TotalSalesKZT:   totalSales,
		TotalReturnsKZT: totalReturns,
		NetRevenueKZT:   netRevenue,
		TotalVATKZT:     totalVAT,
		SalesCount:      salesCount,
		ReturnsCount:    returnsCount,
		CashInDrawer:    cashInDrawer,
		ByTender:        byTender,
	}, nil
}

// CloseZReport closes shift, transmits final report to OFD and zeroes registers
func (m *ShiftManager) CloseZReport() (*ZReportResult, error) {
	xReport, err := m.GenerateXReport()
	if err != nil {
		return nil, err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Фискалды қолтаңба қалыптастыру
	receipt := &FiscalReceipt{
		ReceiptNumber: fmt.Sprintf("Z-SHIFT-%d", m.ShiftNumber),
		CashboxRNM:    m.CashboxRNM,
		OperatorIIN:   m.CashierIIN,
		TotalAmount:   xReport.NetRevenueKZT,
		VATAmount:     xReport.TotalVATKZT,
		Timestamp:     time.Now().UTC(),
	}

	sigResult, err := m.FiscalSigner.SignReceipt(receipt, m.ShiftNumber*1000)
	if err != nil {
		return nil, fmt.Errorf("ОФД Z-есеп фискалдандыру қатесі: %w", err)
	}

	m.IsOpen = false
	return &ZReportResult{
		Summary:       xReport,
		ClosedAt:      receipt.Timestamp,
		FiscalResult:  sigResult,
		IsShiftClosed: true,
	}, nil
}

// FormatXReportText formats report for 80mm thermal paper
func (x *XReportSummary) FormatXReportText() string {
	return fmt.Sprintf(`================================
        Х-ЕСЕП (АУЫСЫМДЫҚ)
РНМ: %s
Кассир ЖСН: %s
Ауысым №: %d
Ашылған уақыты: %s
Қалыптасқан уақыты: %s
--------------------------------
Сатылымдар саны: %d
Қайтарулар саны: %d
Жалпы түсім: %.2f KZT
Қайтарылған сома: %.2f KZT
Таза түсім: %.2f KZT
12%% ҚҚС сомасы: %.2f KZT
--------------------------------
Төлем түрлері:
  Қолма-қол: %.2f KZT
  Kaspi QR:  %.2f KZT
  Банк карта: %.2f KZT
Кассадағы қолма-қол ақша: %.2f KZT
================================`,
		x.CashboxRNM,
		x.CashierIIN,
		x.ShiftNumber,
		x.OpenedAt.Format("02.01.2006 15:04"),
		x.GeneratedAt.Format("02.01.2006 15:04"),
		x.SalesCount,
		x.ReturnsCount,
		x.TotalSalesKZT,
		x.TotalReturnsKZT,
		x.NetRevenueKZT,
		x.TotalVATKZT,
		x.ByTender[TenderCash],
		x.ByTender[TenderKaspiQR],
		x.ByTender[TenderCard],
		x.CashInDrawer,
	)
}

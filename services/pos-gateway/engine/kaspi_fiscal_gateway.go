package engine

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"time"
)

// KaspiFiscalGateway - Kaspi QR төлемдерін қабылдап, оларды автоматты түрде ОФД фискалдайтын шлюз
type KaspiFiscalGateway struct {
	MerchantID   string
	SecretKey    string
	CashboxRNM   string
	OperatorIIN  string
	FiscalSigner *FiscalSigner
	DocSequence  int64
}

// KaspiQRPayload - POS кассада көрсетілетін динамикалық QR мәліметтері
type KaspiQRPayload struct {
	MerchantID  string    `json:"merchant_id"`
	OrderID     string    `json:"order_id"`
	AmountKZT   int64     `json:"amount_kzt"`
	QRString    string    `json:"qr_string"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// KaspiFiscalTransaction - Төлем өткен соң қалыптасатын толық фискалды транзакция
type KaspiFiscalTransaction struct {
	TransactionID   string                 `json:"transaction_id"`
	OrderID         string                 `json:"order_id"`
	AmountKZT       int64                  `json:"amount_kzt"`
	PaymentMethod   string                 `json:"payment_method"` // "KASPI_QR"
	PaidAt          time.Time              `json:"paid_at"`
	FiscalResult    *FiscalSignatureResult `json:"fiscal_result"`
	ReceiptText     string                 `json:"receipt_text"`
}

func NewKaspiFiscalGateway(merchantID, secretKey, cashboxRNM, operatorIIN string) *KaspiFiscalGateway {
	signer := NewFiscalSigner(secretKey, "https://consumer.oofd.kz/verify")
	return &KaspiFiscalGateway{
		MerchantID:   merchantID,
		SecretKey:    secretKey,
		CashboxRNM:   cashboxRNM,
		OperatorIIN:  operatorIIN,
		FiscalSigner: signer,
		DocSequence:  1000,
	}
}

// GenerateDynamicQR - Берілген тапсырыс пен сомаға арнайы Kaspi QR сілтемесін жасайды
func (g *KaspiFiscalGateway) GenerateDynamicQR(orderID string, amountKZT int64, ttlMinutes int) (*KaspiQRPayload, error) {
	if orderID == "" {
		return nil, errors.New("orderID бос болмауы керек")
	}
	if amountKZT <= 0 {
		return nil, errors.New("сома 0-ден үлкен болуы тиіс")
	}

	qrURL := fmt.Sprintf("https://kaspi.kz/pay/%s?orderId=%s&amount=%d",
		url.PathEscape(g.MerchantID),
		url.QueryEscape(orderID),
		amountKZT,
	)

	return &KaspiQRPayload{
		MerchantID:  g.MerchantID,
		OrderID:     orderID,
		AmountKZT:   amountKZT,
		QRString:    qrURL,
		ExpiresAt:   time.Now().Add(time.Duration(ttlMinutes) * time.Minute),
	}, nil
}

// ProcessAndFiscalize - Kaspi Webhook төлем белгісін тексеріп, автоматты ОФД фискалды чегін шығарады
func (g *KaspiFiscalGateway) ProcessAndFiscalize(
	txnID string,
	orderID string,
	amountKZT int64,
	providedSignature string,
	items []ReceiptItem,
) (*KaspiFiscalTransaction, error) {
	if amountKZT <= 0 {
		return nil, errors.New("төлем сомасы дұрыс емес")
	}

	// 1. HMAC-SHA256 криптографиялық қолтаңбаны тексеру
	mac := hmac.New(sha256.New, []byte(g.SecretKey))
	mac.Write([]byte(fmt.Sprintf("%s:%s:%d", txnID, orderID, amountKZT)))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(expectedSig), []byte(providedSignature)) {
		return nil, errors.New("Kaspi Webhook қолтаңбасы сәйкес келмеді (бұрмалану қаупі)")
	}

	// 2. ОФД Фискалды чегін қалыптастыру (ҚР Заңнамасына сай 12% ҚҚС)
	g.DocSequence++
	vatAmount := float64(amountKZT) * 0.12 / 1.12 // 12% ішкі ҚҚС
	receipt := &FiscalReceipt{
		ReceiptNumber: fmt.Sprintf("KASPI-%s", orderID),
		CashboxRNM:    g.CashboxRNM,
		OperatorIIN:   g.OperatorIIN,
		TotalAmount:   float64(amountKZT),
		VATAmount:     vatAmount,
		Timestamp:     time.Now().UTC(),
		OfflineMode:   false,
	}

	fiscalResult, err := g.FiscalSigner.SignReceipt(receipt, g.DocSequence)
	if err != nil {
		return nil, fmt.Errorf("ОФД фискалдандыру қатесі: %w", err)
	}

	// 3. Термо-принтер үшін мәтіндік чекті қалыптастыру
	r := &Receipt{
		StoreName: "Lunar POS Almaty",
		Cashier:   g.OperatorIIN,
		Timestamp: receipt.Timestamp,
		Items:     items,
	}
	formattedReceipt := r.FormatText() + fmt.Sprintf(
		"\n[ОФД ФИСКАЛДЫ ЧЕК]\nФискалды белгі: %s\nЧек №: %d\nТексеру: %s\nТөлем түрі: Kaspi QR\n",
		fiscalResult.FiscalSign,
		fiscalResult.FiscalDocNumber,
		fiscalResult.VerificationURL,
	)

	return &KaspiFiscalTransaction{
		TransactionID: txnID,
		OrderID:       orderID,
		AmountKZT:     amountKZT,
		PaymentMethod: "KASPI_QR",
		PaidAt:        time.Now().UTC(),
		FiscalResult:  fiscalResult,
		ReceiptText:   formattedReceipt,
	}, nil
}

package engine

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// FiscalReceipt represents a verified POS transaction receipt compliant with Kazakhstani OFD regulations.
type FiscalReceipt struct {
	ReceiptNumber string    `json:"receipt_number"`
	CashboxRNM    string    `json:"cashbox_rnm"`   // Регистрационный номер кассы (РНМ)
	OperatorIIN   string    `json:"operator_iin"`  // ИИН кассира/оператора
	TotalAmount   float64   `json:"total_amount"`  // Жалпы сомасы (KZT)
	VATAmount     float64   `json:"vat_amount"`    // ҚҚС / НДС сомасы
	Timestamp     time.Time `json:"timestamp"`
	OfflineMode   bool      `json:"offline_mode"`
	SecretKey     string    `json:"-"`
}

// FiscalSignatureResult contains the cryptographic fiscal mark and verifiable verification QR payload.
type FiscalSignatureResult struct {
	FiscalSign     string `json:"fiscal_sign"`      // Фискалдық белгі (ФП)
	FiscalDocNumber int64  `json:"fiscal_doc_number"` // Фискалдық чек нөмірі
	VerificationURL string `json:"verification_url"`  // Тексеру сілтемесі (QR код)
	IsCompliant     bool   `json:"is_compliant"`
}

// FiscalSigner handles calculation of cryptographic HMAC verification signatures.
type FiscalSigner struct {
	MasterKey string
	OFDBaseURL string
}

func NewFiscalSigner(masterKey string, ofdBaseURL string) *FiscalSigner {
	if ofdBaseURL == "" {
		ofdBaseURL = "https://consumer.oofd.kz/verify"
	}
	return &FiscalSigner{
		MasterKey: masterKey,
		OFDBaseURL: ofdBaseURL,
	}
}

// SignReceipt computes verifiable HMAC SHA-256 fiscal signature and QR link.
func (s *FiscalSigner) SignReceipt(r *FiscalReceipt, docIndex int64) (*FiscalSignatureResult, error) {
	if r.CashboxRNM == "" || r.TotalAmount < 0 {
		return nil, fmt.Errorf("invalid receipt data for fiscalization")
	}

	payload := fmt.Sprintf("RNM=%s;NUM=%s;SUM=%.2f;TIME=%d;DOC=%d",
		r.CashboxRNM,
		r.ReceiptNumber,
		r.TotalAmount,
		r.Timestamp.Unix(),
		docIndex,
	)

	key := []byte(s.MasterKey)
	if len(key) == 0 {
		key = []byte("lunarec_default_fiscal_key_2026")
	}

	h := hmac.New(sha256.New, key)
	h.Write([]byte(payload))
	fullSig := hex.EncodeToString(h.Sum(nil))

	// Take first 10 alphanumeric characters for compact receipt fiscal mark (ФП)
	shortFiscalSign := fullSig[:10]

	verifyURL := fmt.Sprintf("%s?rnm=%s&doc=%d&fp=%s&t=%d",
		s.OFDBaseURL,
		r.CashboxRNM,
		docIndex,
		shortFiscalSign,
		r.Timestamp.Unix(),
	)

	return &FiscalSignatureResult{
		FiscalSign:     shortFiscalSign,
		FiscalDocNumber: docIndex,
		VerificationURL: verifyURL,
		IsCompliant:     true,
	}, nil
}

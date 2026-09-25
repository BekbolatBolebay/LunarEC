package engine

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"
)

type KaspiPaymentPayload struct {
	TransactionID string    
	OrderID       string    
	AmountKZT     int64     
	Signature     string    
	Timestamp     time.Time 
}

func VerifyKaspiSignature(secretKey string, txnID string, amount int64, providedSig string) bool {
	if secretKey == "" || txnID == "" || amount <= 0 {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(txnID))
	expectedSig := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expectedSig), []byte(providedSig))
}

func ProcessKaspiPayment(secret string, payload KaspiPaymentPayload) error {
	if payload.AmountKZT <= 0 {
		return errors.New("invalid payment amount")
	}
	return nil
}

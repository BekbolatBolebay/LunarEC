package integration

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
)

func VerifyHalykSignature(payload, secretKey, signature string) bool {
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(payload))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

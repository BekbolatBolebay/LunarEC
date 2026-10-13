package tax

import "strings"

func ParseDataMatrix(rawCode string) (gtin string, serial string, ok bool) {
	if len(rawCode) < 14 {
		return "", "", false
	}
	// GS1 AI 01: GTIN 14 digits, AI 21: Serial
	clean := strings.TrimSpace(rawCode)
	if strings.HasPrefix(clean, "01") && len(clean) >= 16 {
		return clean[2:16], clean[16:], true
	}
	return clean[:14], clean[14:], true
}

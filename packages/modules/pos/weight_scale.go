package pos

import (
	"errors"
	"fmt"
	"strconv"
)

type WeightBarcodeInfo struct {
	ItemCode string
	WeightKg float64
	RawCode  string
}

// ParseWeightBarcode parses 13-digit EAN barcode with prefix 20..29 (e.g. 2100123015004 -> item 123, 1.500 kg)
func ParseWeightBarcode(barcode string) (*WeightBarcodeInfo, error) {
	if len(barcode) != 13 {
		return nil, errors.New("штрих-код 13 таңбалы болуы тиіс")
	}
	prefix := barcode[:2]
	if prefix < "20" || prefix > "29" {
		return nil, errors.New("өлшенетін тауар префиксі (20..29) табылмады")
	}
	itemCode := barcode[2:7]
	weightGramsStr := barcode[7:12]
	grams, err := strconv.ParseFloat(weightGramsStr, 64)
	if err != nil {
		return nil, fmt.Errorf("салмақты оқу қатесі: %w", err)
	}
	return &WeightBarcodeInfo{
		ItemCode: itemCode,
		WeightKg: grams / 1000.0,
		RawCode:  barcode,
	}, nil
}

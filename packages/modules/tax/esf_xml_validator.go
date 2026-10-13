package tax

import (
	"errors"
	"math"
)

func ValidateESFRow(quantity, unitPrice, vatRate, vatAmount, totalWithVat float64) error {
	subtotal := quantity * unitPrice
	expectedVat := subtotal * (vatRate / 100.0)
	expectedTotal := subtotal + expectedVat

	if math.Abs(vatAmount-expectedVat) > 0.05 {
		return errors.New("ҚҚС 12% сомасының математикалық сәйкессіздігі")
	}
	if math.Abs(totalWithVat-expectedTotal) > 0.05 {
		return errors.New("жалпы соманың есептелу қатесі")
	}
	return nil
}

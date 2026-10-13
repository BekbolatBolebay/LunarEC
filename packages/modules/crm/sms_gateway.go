package crm

import "fmt"

func FormatReceiptSMS(clientName, receiptURL string, totalKZT float64) string {
	return fmt.Sprintf("Құрметті %s! Сатып алғаныңызға рақмет. Сомасы: %.0f KZT. Чек: %s", clientName, totalKZT, receiptURL)
}

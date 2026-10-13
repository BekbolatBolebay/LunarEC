package accounting

import "strings"

func MatchBankPayment(expectedInvoiceNo string, bankPaymentDetails string) bool {
	return strings.Contains(strings.ToUpper(bankPaymentDetails), strings.ToUpper(expectedInvoiceNo))
}

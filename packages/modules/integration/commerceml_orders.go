package integration

import "fmt"

func FormatCommerceMLOrderHeader(orderID, clientBIN string, totalKZT float64) string {
	return fmt.Sprintf("<Заказ><Номер>%s</Номер><КонтрагентБИН>%s</КонтрагентБИН><Сумма>%.2f</Сумма></Заказ>", orderID, clientBIN, totalKZT)
}

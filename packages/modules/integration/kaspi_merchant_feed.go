package integration

import "fmt"

func FormatKaspiFeedItem(sku string, priceKZT float64, inStock bool) string {
	avail := "yes"
	if !inStock {
		avail = "no"
	}
	return fmt.Sprintf("<offer id="%s" available="%s"><price>%.0f</price></offer>", sku, avail, priceKZT)
}

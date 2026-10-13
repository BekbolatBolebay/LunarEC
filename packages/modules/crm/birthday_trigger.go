package crm

import "fmt"

func GenerateBirthdayCoupon(customerID string, year int) string {
	return fmt.Sprintf("BDAY-%s-%d", customerID, year)
}

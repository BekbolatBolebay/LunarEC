package security

func MaskPhoneNumber(phone string) string {
	if len(phone) < 10 {
		return phone
	}
	// Мысалы: +7 701 *** ** 88
	return phone[:5] + "*** ** " + phone[len(phone)-2:]
}

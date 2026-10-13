package tax

func VerifyExciseStamp(stampCode string) bool {
	// УКМ акциздік маркасы әдетте 12 немесе 16 таңбалы әріптік-цифрлық код
	return len(stampCode) >= 12 && len(stampCode) <= 20
}

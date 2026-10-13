package security

func IsTokenExpired(expUnix int64, currentUnix int64) bool {
	return currentUnix >= expUnix
}

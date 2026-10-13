package security

type RateLimiter struct {
	MaxRequestsPerMin int
	CurrentCount      int
}

func (r *RateLimiter) AllowRequest() bool {
	if r.CurrentCount < r.MaxRequestsPerMin {
		r.CurrentCount++
		return true
	}
	return false
}

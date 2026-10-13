package hr

func IsAdvanceApproved(requestedAmount, monthlySalary float64) bool {
	return requestedAmount > 0 && requestedAmount <= (monthlySalary*0.50)
}

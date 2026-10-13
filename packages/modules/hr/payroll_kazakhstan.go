package hr

type NetSalaryResult struct {
	GrossSalary float64
	OPV10       float64
	VOSMS2      float64
	IPN10       float64
	NetSalary   float64
}

func CalculateKZNetSalary(gross float64, standardDeduction float64) NetSalaryResult {
	opv := gross * 0.10
	vosms := gross * 0.02
	taxableBase := gross - opv - vosms - standardDeduction
	if taxableBase < 0 {
		taxableBase = 0
	}
	ipn := taxableBase * 0.10
	net := gross - opv - vosms - ipn
	return NetSalaryResult{
		GrossSalary: gross,
		OPV10:       opv,
		VOSMS2:      vosms,
		IPN10:       ipn,
		NetSalary:   net,
	}
}

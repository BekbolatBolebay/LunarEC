package crm

type DealInfo struct {
	BudgetKZT float64
	MeetingsHeld int
	HasDecisionMakerContact bool
}

func CalculateWinProbability(d DealInfo) int {
	score := 20
	if d.BudgetKZT > 1000000 {
		score += 30
	}
	if d.MeetingsHeld >= 2 {
		score += 25
	}
	if d.HasDecisionMakerContact {
		score += 25
	}
	return score
}

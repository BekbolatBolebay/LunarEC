package kitchen

import "time"

type CookDuration struct {
	StartTime time.Time
	EndTime   time.Time
}

func (c *CookDuration) MinutesTaken() float64 {
	return c.EndTime.Sub(c.StartTime).Minutes()
}

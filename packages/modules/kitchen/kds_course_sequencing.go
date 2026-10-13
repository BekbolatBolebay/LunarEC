package kitchen

type CourseType string

const (
	CourseStarter CourseType = "STARTER"
	CourseMain    CourseType = "MAIN"
	CourseDessert CourseType = "DESSERT"
)

type DishTicket struct {
	Name      string
	Course    CourseType
	HoldUntil int64 // unix timestamp
	IsFired   bool
}

func FireNextCourse(tickets []*DishTicket, course CourseType) {
	for _, t := range tickets {
		if t.Course == course {
			t.IsFired = true
		}
	}
}

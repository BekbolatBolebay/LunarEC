package security

type UserRole string

const (
	RoleCashier     UserRole = "CASHIER"
	RoleHeadCashier UserRole = "HEAD_CASHIER"
	RoleAccountant  UserRole = "ACCOUNTANT"
	RoleDirector    UserRole = "DIRECTOR"
)

func CanVoidReceipt(r UserRole) bool {
	return r == RoleHeadCashier || r == RoleDirector
}

func CanModifyPrice(r UserRole) bool {
	return r == RoleDirector
}

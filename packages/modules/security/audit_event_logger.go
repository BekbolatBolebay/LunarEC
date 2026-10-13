package security

import "time"

type AuditLogEntry struct {
	UserID    string
	Action    string
	Entity    string
	OldValue  string
	NewValue  string
	Timestamp time.Time
}

func CreateAuditEntry(userID, action, entity, oldVal, newVal string) AuditLogEntry {
	return AuditLogEntry{
		UserID:    userID,
		Action:    action,
		Entity:    entity,
		OldValue:  oldVal,
		NewValue:  newVal,
		Timestamp: time.Now().UTC(),
	}
}

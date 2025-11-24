package models

import "time"

// TokenBlacklist stores revoked JWT tokens until they expire naturally
type TokenBlacklist struct {
	Token     string    `gorm:"primaryKey;size:512"`
	ExpiresAt time.Time `gorm:"index"`
}

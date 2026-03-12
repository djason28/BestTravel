package models

import "time"

// TokenBlacklist stores revoked JWT tokens by their JTI until they expire naturally.
// JTI (JWT ID) is a short UUID (36 chars) — far more efficient to index than the full token.
type TokenBlacklist struct {
	JTI       string    `gorm:"primaryKey;size:36"`  // jwt.RegisteredClaims.ID
	ExpiresAt time.Time `gorm:"index"`
}

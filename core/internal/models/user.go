package models

import (
	"time"
)

type User struct {
	ID           string    `gorm:"primaryKey;size:36" json:"id"`
	Email        string    `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `gorm:"size:255" json:"name"`
	Role         string    `gorm:"size:50;default:admin" json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

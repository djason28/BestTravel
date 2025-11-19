package models

import "time"

type Inquiry struct {
	ID            string    `gorm:"primaryKey;size:36" json:"id"`
	PackageID     string    `gorm:"size:36" json:"packageId"`
	PackageTitle  string    `gorm:"size:255" json:"packageTitle"`
	Name          string    `gorm:"size:255;not null" json:"name"`
	Email         string    `gorm:"size:255" json:"email"`
	Phone         string    `gorm:"size:50" json:"phone"`
	Subject       string    `gorm:"size:255" json:"subject"`
	Message       string    `gorm:"type:text" json:"message"`
	Participants  int       `json:"participants"`
	PreferredDate string    `gorm:"size:50" json:"preferredDate"`
	Status        string    `gorm:"size:50;default:new" json:"status"`
	Source        string    `gorm:"size:50;default:form" json:"source"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

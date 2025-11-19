package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type Package struct {
	ID               string          `gorm:"primaryKey;size:36" json:"id"`
	Title            string          `gorm:"size:255;not null" json:"title"`
	Slug             string          `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Description      string          `gorm:"type:text" json:"description"`
	ShortDescription string          `gorm:"type:text" json:"shortDescription"`
	Price            int64           `gorm:"index;index:idx_pkg_status_price,priority:2" json:"price"`
	Currency         string          `gorm:"size:10;default:IDR;index" json:"currency"`
	Duration         int             `gorm:"index;index:idx_pkg_status_dest_dur,priority:3" json:"duration"`
	DurationUnit     string          `gorm:"size:20;default:days" json:"durationUnit"`
	Categories       StringArray     `gorm:"type:text" json:"categories"`
	Destination      string          `gorm:"size:100;index;index:idx_pkg_status_dest_dur,priority:2" json:"destination"`
	Included         StringArray     `gorm:"type:text" json:"included"`
	Excluded         StringArray     `gorm:"type:text" json:"excluded"`
	Highlights       StringArray     `gorm:"type:text" json:"highlights"`
	Availability     string          `gorm:"size:100;index" json:"availability"`
	MaxParticipants  int             `gorm:"index" json:"maxParticipants"`
	Featured         bool            `gorm:"index;index:idx_pkg_status_featured,priority:2" json:"featured"`
	Status           string          `gorm:"size:50;default:draft;index;index:idx_pkg_status_dest_dur,priority:1;index:idx_pkg_status_featured,priority:1;index:idx_pkg_status_price,priority:1" json:"status"`
	ViewCount        int64           `gorm:"index" json:"viewCount"`
	InquiryCount     int64           `gorm:"index" json:"inquiryCount"`
	Images           []PackageImage  `json:"images"`
	Itinerary        []ItineraryItem `json:"itinerary"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
}

type PackageImage struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	PackageID string    `gorm:"index" json:"packageId"`
	URL       string    `gorm:"type:text;not null" json:"url"`
	Alt       string    `gorm:"size:255" json:"alt"`
	Order     int       `json:"order"`
	IsCover   bool      `json:"isCover"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ItineraryItem struct {
	ID            string      `gorm:"primaryKey;size:36" json:"id"`
	PackageID     string      `gorm:"index" json:"packageId"`
	Day           int         `json:"day"`
	Title         string      `gorm:"size:255" json:"title"`
	Description   string      `gorm:"type:text" json:"description"`
	Activities    StringArray `gorm:"type:text" json:"activities"`
	Meals         StringArray `gorm:"type:text" json:"meals"`
	Accommodation string      `gorm:"size:255" json:"accommodation"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
}

// StringArray is a JSON-encoded []string stored as TEXT
type StringArray []string

func (a *StringArray) Scan(src interface{}) error {
	switch v := src.(type) {
	case []byte:
		return json.Unmarshal(v, a)
	case string:
		return json.Unmarshal([]byte(v), a)
	default:
		*a = []string{}
		return nil
	}
}

func (a StringArray) Value() (driver.Value, error) {
	b, err := json.Marshal(a)
	return string(b), err
}

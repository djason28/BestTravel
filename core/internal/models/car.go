package models

import (
	"time"

	"gorm.io/gorm"
)

type Car struct {
	ID               string        `gorm:"primaryKey;size:36" json:"id"`
	Name             string        `gorm:"size:255;not null" json:"name"`
	NameZh           string        `gorm:"column:name_zh;size:255" json:"nameZh"`
	Slug             string        `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Description      string        `gorm:"type:text" json:"description"`
	DescriptionZh    string        `gorm:"column:description_zh;type:text" json:"descriptionZh"`
	Brand            string        `gorm:"size:100" json:"brand"`
	Model            string        `gorm:"column:model_name;size:100" json:"model"`
	Year             int           `json:"year"`
	Seats            int           `json:"seats"`
	Transmission     string        `gorm:"size:50;default:automatic" json:"transmission"` // automatic, manual
	FuelType         string        `gorm:"column:fuel_type;size:50" json:"fuelType"`     // petrol, diesel, electric, hybrid
	Prices           PriceList     `gorm:"column:prices_json;type:text" json:"prices"`
	Price            int64         `gorm:"index" json:"price"`
	Currency         string        `gorm:"size:10;default:IDR" json:"currency"`
	PriceUnit        string        `gorm:"column:price_unit;size:50;default:day" json:"priceUnit"` // day, trip, hour
	MinDays          int           `gorm:"column:min_days;default:1" json:"minDays"`
	WithDriver       bool          `gorm:"column:with_driver" json:"withDriver"`
	Features         StringArray   `gorm:"column:features_json;type:text" json:"features"`
	FeaturesZh       StringArray   `gorm:"column:features_zh_json;type:text" json:"featuresZh"`
	Included         StringArray   `gorm:"column:included_json;type:text" json:"included"`
	IncludedZh       StringArray   `gorm:"column:included_zh_json;type:text" json:"includedZh"`
	Excluded         StringArray   `gorm:"column:excluded_json;type:text" json:"excluded"`
	ExcludedZh       StringArray   `gorm:"column:excluded_zh_json;type:text" json:"excludedZh"`
	ImageURL         string        `gorm:"column:image_url;type:text" json:"imageUrl"`
	Images           ImageList     `gorm:"column:images_json;type:text" json:"images"`
	Availability     string        `gorm:"size:100" json:"availability"`
	AvailabilityZh   string        `gorm:"column:availability_zh;size:100" json:"availabilityZh"`
	Status           string        `gorm:"size:50;default:draft;index" json:"status"` // draft, published, archived
	Featured         bool          `gorm:"index" json:"featured"`
	ViewCount        int64         `gorm:"column:view_count" json:"viewCount"`
	InquiryCount     int64         `gorm:"column:inquiry_count" json:"inquiryCount"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

const (
	CarStatusDraft     = "draft"
	CarStatusPublished = "published"
	CarStatusArchived  = "archived"
)

func IsValidCarStatus(s string) bool {
	return s == CarStatusDraft || s == CarStatusPublished || s == CarStatusArchived
}

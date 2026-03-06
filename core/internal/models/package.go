package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type Package struct {
	ID                 string          `gorm:"primaryKey;size:36" json:"id"`
	Title              string          `gorm:"size:255;not null" json:"title"`
	TitleZh            string          `gorm:"size:255" json:"titleZh"`
	Slug               string          `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Description        string          `gorm:"type:text" json:"description"`
	DescriptionZh      string          `gorm:"column:description_zh;type:text" json:"descriptionZh"`
	ShortDescription   string          `gorm:"column:short_description;type:text" json:"shortDescription"`
	ShortDescriptionZh string          `gorm:"column:short_description_zh;type:text" json:"shortDescriptionZh"`
	Price              int64           `gorm:"index;index:idx_pkg_status_price,priority:2" json:"price"`
	Currency           string          `gorm:"size:10;default:IDR;index" json:"currency"`
	Prices             PriceList       `gorm:"column:prices_json;type:text" json:"prices"`
	Duration           int             `gorm:"index;index:idx_pkg_status_dest_dur,priority:3" json:"duration"`
	DurationUnit       string          `gorm:"column:duration_unit;size:20;default:days" json:"durationUnit"`
	Categories         StringArray     `gorm:"column:categories_json;type:text" json:"categories"`
	CategoriesZh       StringArray     `gorm:"column:categories_zh_json;type:text" json:"categoriesZh"`
	Destination        string          `gorm:"size:100;index;index:idx_pkg_status_dest_dur,priority:2" json:"destination"`
	DestinationZh      string          `gorm:"column:destination_zh;size:100;index" json:"destinationZh"`
	Included           StringArray     `gorm:"column:included_json;type:text" json:"included"`
	IncludedZh         StringArray     `gorm:"column:included_zh_json;type:text" json:"includedZh"`
	Excluded           StringArray     `gorm:"column:excluded_json;type:text" json:"excluded"`
	ExcludedZh         StringArray     `gorm:"column:excluded_zh_json;type:text" json:"excludedZh"`
	Highlights         StringArray     `gorm:"column:highlights_json;type:text" json:"highlights"`
	HighlightsZh       StringArray     `gorm:"column:highlights_zh_json;type:text" json:"highlightsZh"`
	Availability       string          `gorm:"size:100;index" json:"availability"`
	AvailabilityZh     string          `gorm:"column:availability_zh;size:100;index" json:"availabilityZh"`
	MinParticipants    int             `gorm:"column:min_participants" json:"minParticipants"`
	MaxParticipants    int             `gorm:"column:max_participants;index" json:"maxParticipants"`
	Featured           bool            `gorm:"index;index:idx_pkg_status_featured,priority:2" json:"featured"`
	Status             string          `gorm:"size:50;default:draft;index;index:idx_pkg_status_dest_dur,priority:1;index:idx_pkg_status_featured,priority:1;index:idx_pkg_status_price,priority:1" json:"status"`
	ViewCount          int64           `gorm:"column:view_count;index" json:"viewCount"`
	InquiryCount       int64           `gorm:"column:inquiry_count;index" json:"inquiryCount"`
	ImageURL           string          `gorm:"column:image_url;type:text" json:"imageUrl"`
	Images             ImageList       `gorm:"column:images_json;type:text" json:"images"`
	Itinerary          ItineraryList   `gorm:"column:itinerary_json;type:text" json:"itinerary"`
	CreatedAt          time.Time       `json:"createdAt"`
	UpdatedAt          time.Time       `json:"updatedAt"`
	DeletedAt          gorm.DeletedAt  `gorm:"index" json:"-"`
}

type PackageImage struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	PackageID string    `gorm:"-" json:"packageId"`
	URL       string    `gorm:"type:text;not null" json:"url"`
	Alt       string    `gorm:"size:255" json:"alt"`
	Order     int       `json:"order"`
	IsCover   bool      `json:"isCover"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ItineraryItem struct {
	ID              string      `gorm:"primaryKey;size:36" json:"id"`
	PackageID       string      `gorm:"-" json:"packageId"`
	Day             int         `json:"day"`
	Title           string      `gorm:"size:255" json:"title"`
	TitleZh         string      `gorm:"size:255" json:"titleZh"`
	Description     string      `gorm:"type:text" json:"description"`
	DescriptionZh   string      `gorm:"type:text" json:"descriptionZh"`
	Activities      StringArray `gorm:"type:text" json:"activities"`
	ActivitiesZh    StringArray `gorm:"type:text" json:"activitiesZh"`
	Meals           StringArray `gorm:"type:text" json:"meals"`
	MealsZh         StringArray `gorm:"type:text" json:"mealsZh"`
	Accommodation   string      `gorm:"size:255" json:"accommodation"`
	AccommodationZh string      `gorm:"size:255" json:"accommodationZh"`
	CreatedAt       time.Time   `json:"createdAt"`
	UpdatedAt       time.Time   `json:"updatedAt"`
}

// ImageList stores PackageImage slice as JSON in a TEXT column.
type ImageList []PackageImage

func (l *ImageList) Scan(src interface{}) error {
	return scanJSON(src, l)
}

func (l ImageList) Value() (driver.Value, error) {
	return valueJSON(l)
}

// ItineraryList stores ItineraryItem slice as JSON in a TEXT column.
type ItineraryList []ItineraryItem

func (l *ItineraryList) Scan(src interface{}) error {
	return scanJSON(src, l)
}

func (l ItineraryList) Value() (driver.Value, error) {
	return valueJSON(l)
}

// PricePair represents a price in a specific currency.
type PricePair struct {
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
}

// PriceList stores []PricePair as JSON in a TEXT column.
type PriceList []PricePair

func (l *PriceList) Scan(src interface{}) error {
	return scanJSON(src, l)
}

func (l PriceList) Value() (driver.Value, error) {
	return valueJSON(l)
}

// StringArray is a JSON-encoded []string stored as TEXT
type StringArray []string

func (a *StringArray) Scan(src interface{}) error {
	return scanJSON(src, a)
}

func (a StringArray) Value() (driver.Value, error) {
	return valueJSON(a)
}

func scanJSON(src interface{}, dst interface{}) error {
	switch v := src.(type) {
	case []byte:
		return json.Unmarshal(v, dst)
	case string:
		return json.Unmarshal([]byte(v), dst)
	case nil:
		return json.Unmarshal([]byte("[]"), dst)
	default:
		return json.Unmarshal([]byte("[]"), dst)
	}
}

func valueJSON(src interface{}) (driver.Value, error) {
	b, err := json.Marshal(src)
	if err != nil {
		return "[]", err
	}
	return string(b), nil
}

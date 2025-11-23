package controllers

import "strings"

var allowedSort = map[string]string{
	"newest":         "created_at DESC",
	"popular":        "view_count DESC",
	"price_asc":      "price ASC",
	"price_desc":     "price DESC",
	"duration_asc":   "duration ASC",
	"duration_desc":  "duration DESC",
	"inquiries_asc":  "inquiry_count ASC",
	"inquiries_desc": "inquiry_count DESC",
}

func applySort(query string) (string, bool) {
	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" || q == "newest" {
		return allowedSort["newest"], true
	}
	val, ok := allowedSort[q]
	return val, ok
}

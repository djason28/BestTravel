package controllers

import "strings"

func applySort(query string) string {
	switch strings.ToLower(query) {
	case "popular":
		return "view_count DESC"
	case "price_asc":
		return "price ASC"
	case "price_desc":
		return "price DESC"
	case "duration_asc":
		return "duration ASC"
	case "duration_desc":
		return "duration DESC"
	case "inquiries_asc":
		return "inquiry_count ASC"
	case "inquiries_desc":
		return "inquiry_count DESC"
	default:
		return "created_at DESC"
	}
}

package controllers

import (
	"strings"

	"besttravel/internal/models"
)

func normalizeCurrency(s string) string {
	s = strings.ToUpper(strings.TrimSpace(s))
	if s == "" {
		return "IDR"
	}
	return s
}

func primaryPrice(prices []models.PricePair) int64 {
	if len(prices) > 0 {
		return prices[0].Amount
	}
	return 0
}

func primaryCurrency(prices []models.PricePair) string {
	if len(prices) > 0 {
		return normalizeCurrency(prices[0].Currency)
	}
	return "IDR"
}



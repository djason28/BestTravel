package controllers

import (
	"strings"
)

func normalizeCurrency(s string) string {
	s = strings.ToUpper(strings.TrimSpace(s))
	if s == "" {
		return "IDR"
	}
	return s
}



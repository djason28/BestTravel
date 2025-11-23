package controllers

// Centralized validation helpers to reduce duplication in controllers.

var allowedCurrencies = map[string]struct{}{"IDR": {}, "USD": {}, "SGD": {}}
var allowedStatuses = map[string]struct{}{"draft": {}, "published": {}}

func IsValidCurrency(s string) bool {
	_, ok := allowedCurrencies[s]
	return ok
}

func IsValidStatus(s string) bool {
	_, ok := allowedStatuses[s]
	return ok
}

// ClampMinInt returns def if v < min and v != 0 (allows zero to mean 'unset')
func ClampMinInt(v, min, def int) int {
	if v == 0 { // treat zero as 'not provided'
		return v
	}
	if v < min {
		return def
	}
	return v
}

// NormalizeStatus applies default if empty or invalid
func NormalizeStatus(s, def string) string {
	if s == "" {
		return def
	}
	if !IsValidStatus(s) {
		return def
	}
	return s
}

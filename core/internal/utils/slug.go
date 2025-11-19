package utils

import (
	"regexp"
	"strings"
)

var slugRegex = regexp.MustCompile("[^a-z0-9-]+")

func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	s = slugRegex.ReplaceAllString(s, "")
	s = strings.Trim(s, "-")
	if s == "" {
		return "item"
	}
	return s
}

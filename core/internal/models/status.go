package models

// Package statuses.
const (
	StatusDraft     = "draft"
	StatusPublished = "published"
	StatusArchived  = "archived"
)

var PackageStatusSet = map[string]struct{}{
	StatusDraft: {}, StatusPublished: {}, StatusArchived: {},
}

func IsValidPackageStatus(s string) bool {
	_, ok := PackageStatusSet[s]
	return ok
}

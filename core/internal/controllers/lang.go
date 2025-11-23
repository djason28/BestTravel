package controllers

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// detectLang checks query param 'lang' first, then Accept-Language header.
// Returns "zh" for any header containing zh, else "en".
func detectLang(c *gin.Context) string {
	q := strings.ToLower(strings.TrimSpace(c.Query("lang")))
	if q == "zh" {
		return "zh"
	}
	if q == "en" {
		return "en"
	}
	al := strings.ToLower(c.GetHeader("Accept-Language"))
	if strings.Contains(al, "zh") {
		return "zh"
	}
	return "en"
}

// writeLang forces language response override using applyLangZh if needed.
// obj must be *models.Package or *[]models.Package
// writeLang removed (unused). Language application handled directly in controllers.

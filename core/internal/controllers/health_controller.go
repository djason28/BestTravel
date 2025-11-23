package controllers

import (
	"net/http"
	"time"

	"besttravel/internal/database"

	"github.com/gin-gonic/gin"
)

var startTime = time.Now()

// Health returns application health including DB status and uptime.
func Health(c *gin.Context) {
	// Simple DB ping (SELECT 1). If it fails we mark status degraded.
	dbOK := database.DB.Exec("SELECT 1").Error == nil
	status := "ok"
	if !dbOK {
		status = "degraded"
	}
	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"status":        status,
		"db":            dbOK,
		"uptimeSeconds": int(time.Since(startTime).Seconds()),
		"timestamp":     time.Now().UTC(),
	})
}

package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// SlowRequest logs requests that exceed the given threshold.
// It includes method, path, status, latency, client IP, and request ID when present.
func SlowRequest(threshold time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if threshold <= 0 {
			c.Next()
			return
		}
		start := time.Now()
		c.Next()
		dur := time.Since(start)
		if dur >= threshold {
			rid, _ := c.Get("request_id")
			log.Printf("SLOW %s %s -> %d in %s ip=%s rid=%v", c.Request.Method, c.Request.URL.Path, c.Writer.Status(), dur, c.ClientIP(), rid)
		}
	}
}

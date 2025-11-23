package middleware

import (
	"besttravel/internal/logger"
	"time"

	"log/slog"

	"github.com/gin-gonic/gin"
)

// StructuredLogger logs requests using slog
func StructuredLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Log after request
		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		errorMessage := c.Errors.ByType(gin.ErrorTypePrivate).String()

		if raw != "" {
			path = path + "?" + raw
		}

		attrs := []any{
			slog.String("method", method),
			slog.String("path", path),
			slog.Int("status", statusCode),
			slog.String("ip", clientIP),
			slog.Duration("latency", latency),
		}

		if errorMessage != "" {
			attrs = append(attrs, slog.String("error", errorMessage))
		}

		msg := "Incoming request"
		if statusCode >= 500 {
			logger.Log.Error(msg, attrs...)
		} else if statusCode >= 400 {
			logger.Log.Warn(msg, attrs...)
		} else {
			logger.Log.Info(msg, attrs...)
		}
	}
}

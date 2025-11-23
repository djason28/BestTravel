package middleware

import (
	"context"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type ipKey string

type clientLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	limiterStore = make(map[ipKey]*clientLimiter)
	mu           sync.Mutex
)

func getIP(c *gin.Context) string {
	ip := c.ClientIP()
	if ip == "" {
		ip, _, _ = net.SplitHostPort(c.Request.RemoteAddr)
	}
	return ip
}

func getLimiter(ip string, r rate.Limit, b int) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()
	key := ipKey(ip)
	client, exists := limiterStore[key]
	if !exists {
		client = &clientLimiter{
			limiter: rate.NewLimiter(r, b),
		}
		limiterStore[key] = client
	}
	client.lastSeen = time.Now()
	return client.limiter
}

// RateLimit limits requests per IP
func RateLimit(rps float64, burst int) gin.HandlerFunc {
	return func(c *gin.Context) {
		limiter := getLimiter(getIP(c), rate.Limit(rps), burst)
		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"success": false, "error": "too many requests"})
			return
		}
		c.Next()
	}
}

// LoginRateLimit creates a stricter limiter for login endpoints
// e.g. 5 requests per minute
func LoginRateLimit() gin.HandlerFunc {
	// Use a separate store for login attempts to avoid conflict with global limiter
	// For simplicity in this example, we reuse the logic but could use a different map key prefix
	// Ideally, use a separate map or prefix the IP.
	return func(c *gin.Context) {
		ip := getIP(c)
		// Prefix IP to distinguish from global limiter
		loginKey := "login:" + ip

		// 5 requests per minute (approx 0.083 rps), burst 5
		limiter := getLimiter(loginKey, rate.Limit(5.0/60.0), 5)

		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "too many login attempts, please try again later",
			})
			return
		}
		c.Next()
	}
}

// Cleanup old limiters periodically
func StartLimiterCleanup(interval time.Duration) {
	go func() {
		for range time.Tick(interval) {
			mu.Lock()
			for k, client := range limiterStore {
				if time.Since(client.lastSeen) > interval {
					delete(limiterStore, k)
				}
			}
			mu.Unlock()
		}
	}()
}

// RequestTimeout enforces a max duration for handling a request.
// If the context times out, it aborts with 504 and stops further handlers.
func RequestTimeout(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if timeout <= 0 {
			c.Next()
			return
		}
		done := make(chan struct{})
		panicChan := make(chan any, 1)

		// Derive a context with timeout for the request
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)

		go func() {
			defer close(done)
			defer func() {
				if p := recover(); p != nil {
					panicChan <- p
				}
			}()
			c.Next()
		}()

		select {
		case p := <-panicChan:
			// Re-panic to let Gin recover middleware handle it, but ensure we abort
			_ = p
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"success": false, "error": "internal server error"})
		case <-done:
			// Completed within time
			return
		case <-ctx.Done():
			c.AbortWithStatusJSON(http.StatusGatewayTimeout, gin.H{"success": false, "error": "request timeout"})
			return
		}
	}
}

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
// It derives a context with a deadline so downstream DB queries (via database.Ctx)
// will respect the timeout. gin.Context is NOT goroutine-safe, so c.Next() runs
// on the same goroutine — the timeout propagates through context cancellation.
func RequestTimeout(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if timeout <= 0 {
			c.Next()
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

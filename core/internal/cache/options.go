package cache

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type entry struct {
	data    gin.H
	expires time.Time
}

var (
	mu    sync.RWMutex
	store = map[string]entry{}
	ttl   = 2 * time.Minute
)

// Get returns cached data if not expired.
func Get(key string) (gin.H, bool) {
	mu.RLock()
	e, ok := store[key]
	mu.RUnlock()
	if !ok || time.Now().After(e.expires) {
		return nil, false
	}
	return e.data, true
}

// Set stores data with TTL.
func Set(key string, data gin.H) {
	mu.Lock()
	store[key] = entry{data: data, expires: time.Now().Add(ttl)}
	mu.Unlock()
}

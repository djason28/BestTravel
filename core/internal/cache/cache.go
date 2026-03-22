package cache

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/patrickmn/go-cache"
)

var (
	// Default TTL 5 minutes, purge every 10 minutes
	C = cache.New(5*time.Minute, 10*time.Minute)
)

// InvalidateOptions removes all cached option entries
func InvalidateOptions() {
	for k := range C.Items() {
		if strings.HasPrefix(k, "options:") {
			C.Delete(k)
		}
	}
}

// InvalidatePackages clears all cached package lists
func InvalidatePackages() {
	for k := range C.Items() {
		if strings.HasPrefix(k, "pkg:list:") {
			C.Delete(k)
		}
	}
}

func Get(key string) (gin.H, bool) {
	if x, found := C.Get(key); found {
		return x.(gin.H), true
	}
	return nil, false
}

func Set(key string, data gin.H) {
	C.Set(key, data, cache.DefaultExpiration)
}

func GetPackageList(key string) (interface{}, bool) {
	if x, found := C.Get(key); found {
		return x, true
	}
	return nil, false
}

func SetPackageList(key string, data interface{}) {
	C.Set(key, data, 30*time.Second) // Match old TTL
}

func InvalidateCars() {
	for k := range C.Items() {
		if strings.HasPrefix(k, "car:list:") {
			C.Delete(k)
		}
	}
}

func GetCarList(key string) (interface{}, bool) {
	if x, found := C.Get(key); found {
		return x, true
	}
	return nil, false
}

func SetCarList(key string, data interface{}) {
	C.Set(key, data, 30*time.Second)
}

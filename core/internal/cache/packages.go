package cache

import (
	"strings"
	"sync"
	"time"
)

type listEntry struct {
	data    interface{}
	expires time.Time
}

var (
	listMu    sync.RWMutex
	listStore = map[string]listEntry{}
	listTTL   = 30 * time.Second
)

func GetPackageList(key string) (interface{}, bool) {
	listMu.RLock()
	e, ok := listStore[key]
	listMu.RUnlock()
	if !ok || time.Now().After(e.expires) {
		return nil, false
	}
	return e.data, true
}

func SetPackageList(key string, data interface{}) {
	listMu.Lock()
	listStore[key] = listEntry{data: data, expires: time.Now().Add(listTTL)}
	listMu.Unlock()
}

// InvalidatePackages clears all cached package lists.
func InvalidatePackages() {
	listMu.Lock()
	for k := range listStore {
		if strings.HasPrefix(k, "pkg:list:") {
			delete(listStore, k)
		}
	}
	listMu.Unlock()
}

// CleanExpired removes cache entries past their TTL to prevent memory buildup.
func CleanExpired() {
	listMu.Lock()
	now := time.Now()
	for k, e := range listStore {
		if now.After(e.expires) {
			delete(listStore, k)
		}
	}
	listMu.Unlock()
}

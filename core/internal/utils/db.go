package utils

import (
	"sync"

	"gorm.io/gorm"
)

// ParallelCountAndList runs Count and a List query concurrently on clones of the base query.
// - q: base gorm.DB with all filters applied
// - listBuilder: function that decorates the list query (preload/order/pagination)
// - items: pointer to slice to store results
// - total: pointer to int64 to store total count
func ParallelCountAndList[T any](q *gorm.DB, listBuilder func(*gorm.DB) *gorm.DB, items *[]T, total *int64) {
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		q.Session(&gorm.Session{}).Count(total)
	}()
	go func() {
		defer wg.Done()
		listBuilder(q.Session(&gorm.Session{})).Find(items)
	}()
	wg.Wait()
}

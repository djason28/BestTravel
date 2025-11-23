package database

import (
	"log"
)

// EnsureIndexes creates helpful indexes if they do not already exist.
// Uses IF NOT EXISTS where supported; otherwise errors ignored.
func EnsureIndexes() {
	// NOTE: Adjust syntax if using MySQL version < 8 that lacks IF NOT EXISTS for indexes.
	stmts := []string{
		"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_status (status)",
		"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_featured (featured)",
		"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_destination (destination)",
		"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_price (price)",
		"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_view_count (view_count)",
		"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_created_at (created_at)",
	}
	for _, stmt := range stmts {
		if err := DB.Exec(stmt).Error; err != nil {
			// ignore unsupported syntax; log for visibility
			log.Printf("index creation skipped/failed for statement '%s': %v", stmt, err)
		}
	}
}

package database

import (
	"log"
)

// EnsureIndexes creates helpful indexes if they do not already exist.
// Accepts the DB driver name to use the correct SQL syntax.
func EnsureIndexes(driver string) {
	var stmts []string

	switch driver {
	case "mysql":
		stmts = []string{
			"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_status (status)",
			"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_featured (featured)",
			"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_destination (destination)",
			"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_price (price)",
			"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_view_count (view_count)",
			"ALTER TABLE packages ADD INDEX IF NOT EXISTS idx_packages_created_at (created_at)",
		}
	default: // sqlite, turso
		stmts = []string{
			"CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status)",
			"CREATE INDEX IF NOT EXISTS idx_packages_featured ON packages(featured)",
			"CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination)",
			"CREATE INDEX IF NOT EXISTS idx_packages_price ON packages(price)",
			"CREATE INDEX IF NOT EXISTS idx_packages_view_count ON packages(view_count)",
			"CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at)",
		}
	}
	for _, stmt := range stmts {
		if err := DB.Exec(stmt).Error; err != nil {
			log.Printf("index creation skipped/failed for statement '%s': %v", stmt, err)
		}
	}
}

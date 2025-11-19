package database

import (
	"context"
	"log"
	"time"

	"besttravel/internal/config"
	"besttravel/internal/models"

	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) {
	var err error
	switch cfg.DBDriver {
	case "mysql":
		dsn := cfg.DBDSN
		if dsn == "" {
			// Build DSN: user:pass@tcp(host:port)/dbname?params
			pass := cfg.DBPassword
			if pass != "" {
				pass = ":" + pass
			}
			dsn = cfg.DBUser + pass + "@tcp(" + cfg.DBHost + ":" + strconv.Itoa(cfg.DBPort) + ")/" + cfg.DBName + "?" + cfg.DBParams
		}
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{PrepareStmt: true})
		if err != nil {
			log.Fatalf("failed to connect MySQL: %v", err)
		}
		if sqlDB, err := DB.DB(); err == nil {
			sqlDB.SetMaxOpenConns(25)
			sqlDB.SetMaxIdleConns(10)
			sqlDB.SetConnMaxLifetime(1 * time.Hour)
			// Session charset/collation (best-effort)
			_ = DB.Exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci").Error
			// Attempt to enforce database-level charset/collation (ignore error if no privilege)
			_ = DB.Exec("ALTER DATABASE `" + cfg.DBName + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci").Error
			// Health check with timeout to fail fast when misconfigured
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := sqlDB.PingContext(ctx); err != nil {
				log.Fatalf("database ping failed: %v", err)
			}
		}
	default: // sqlite
		// Use SQLite DSN with performance pragmas
		dsn := "file:" + cfg.DBPath + "?cache=shared&_foreign_keys=on&_journal_mode=WAL&_synchronous=NORMAL&_busy_timeout=5000"
		DB, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{
			PrepareStmt: true,
		})
		if err != nil {
			log.Fatalf("failed to connect database: %v", err)
		}
		// Additional PRAGMAs
		_ = DB.Exec("PRAGMA foreign_keys = ON;").Error
		_ = DB.Exec("PRAGMA journal_mode = WAL;").Error
		_ = DB.Exec("PRAGMA synchronous = NORMAL;").Error
		_ = DB.Exec("PRAGMA busy_timeout = 5000;").Error
		_ = DB.Exec("PRAGMA cache_size = -2000;").Error
		if sqlDB, err := DB.DB(); err == nil {
			sqlDB.SetMaxOpenConns(1)
			sqlDB.SetMaxIdleConns(1)
			sqlDB.SetConnMaxLifetime(30 * time.Minute)
		}
	}

	// Auto migrate models
	if err := DB.AutoMigrate(
		&models.User{},
		&models.Package{},
		&models.PackageImage{},
		&models.ItineraryItem{},
		&models.Inquiry{},
	); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}
}

// Ctx returns a gorm.DB bound to the request context for proper cancellation/timeouts.
func Ctx(c *gin.Context) *gorm.DB {
	if DB == nil {
		return nil
	}
	return DB.WithContext(c.Request.Context())
}

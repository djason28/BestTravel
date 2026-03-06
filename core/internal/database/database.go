package database

import (
	"context"
	"log"
	"net/url"
	"strconv"
	"strings"
	"time"

	"besttravel/internal/config"
	"besttravel/internal/models"

	"github.com/gin-gonic/gin"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) {
	var err error
	switch cfg.DBDriver {
	case "mysql":
		log.Printf("[DB] Using MySQL (host=%s port=%d db=%s)", cfg.DBHost, cfg.DBPort, cfg.DBName)
		dsn := cfg.DBDSN
		if dsn == "" {
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
			_ = DB.Exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci").Error
			_ = DB.Exec("ALTER DATABASE `" + cfg.DBName + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci").Error
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := sqlDB.PingContext(ctx); err != nil {
				log.Fatalf("database ping failed: %v", err)
			}
		}
	case "turso":
		log.Printf("[DB] Using Turso (libsql)")
		libsqlURL := normalizeTursoURL(cfg.TursoURL, cfg.TursoAuthToken)
		DB, err = gorm.Open(sqlite.New(sqlite.Config{DriverName: "libsql", DSN: libsqlURL}), &gorm.Config{PrepareStmt: true})
		if err != nil {
			log.Fatalf("failed to connect Turso: %v", err)
		}
		if sqlDB, err := DB.DB(); err == nil {
			sqlDB.SetMaxOpenConns(25)
			sqlDB.SetMaxIdleConns(10)
			sqlDB.SetConnMaxLifetime(1 * time.Hour)
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := sqlDB.PingContext(ctx); err != nil {
				log.Fatalf("database ping failed: %v", err)
			}
		}
		ensurePackagesSchema()
	default:
		log.Fatalf("unsupported DB driver '%s'", cfg.DBDriver)
	}

	// Auto migrate models
	if err := DB.AutoMigrate(
		&models.User{},
		&models.Package{},
		&models.Inquiry{},
		&models.TokenBlacklist{},
	); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}
	log.Printf("[DB] AutoMigrate completed")
}

func normalizeTursoURL(raw, token string) string {
	if raw == "" {
		return raw
	}
	if strings.HasPrefix(raw, "libsql://") {
		// keep as-is for libsql driver
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	q := parsed.Query()
	if token != "" && q.Get("authToken") == "" {
		q.Set("authToken", token)
		parsed.RawQuery = q.Encode()
	}
	return parsed.String()
}

func ensurePackagesSchema() {
	if DB == nil {
		return
	}
	_ = DB.Exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      short_description TEXT,
      title_zh TEXT,
      short_description_zh TEXT,
      description_zh TEXT,
      price INTEGER,
      currency TEXT DEFAULT 'IDR',
      duration INTEGER,
      duration_unit TEXT DEFAULT 'days',
      destination TEXT,
      destination_zh TEXT,
      availability TEXT,
      availability_zh TEXT,
      max_participants INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      inquiry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      image_url TEXT,
      images_json TEXT,
      categories_json TEXT,
      categories_zh_json TEXT,
      highlights_json TEXT,
      highlights_zh_json TEXT,
      included_json TEXT,
      included_zh_json TEXT,
      excluded_json TEXT,
      excluded_zh_json TEXT,
      itinerary_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `).Error
}

// Ctx returns a gorm.DB bound to the request context for proper cancellation/timeouts.
func Ctx(c *gin.Context) *gorm.DB {
	if DB == nil {
		return nil
	}
	return DB.WithContext(c.Request.Context())
}

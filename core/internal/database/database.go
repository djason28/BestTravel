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
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) {
	if cfg.DBDriver != "mysql" {
		log.Fatalf("unsupported DB driver '%s' (only mysql is allowed)", cfg.DBDriver)
	}
	log.Printf("[DB] Using MySQL (host=%s port=%d db=%s)", cfg.DBHost, cfg.DBPort, cfg.DBName)
	dsn := cfg.DBDSN
	if dsn == "" {
		pass := cfg.DBPassword
		if pass != "" {
			pass = ":" + pass
		}
		dsn = cfg.DBUser + pass + "@tcp(" + cfg.DBHost + ":" + strconv.Itoa(cfg.DBPort) + ")/" + cfg.DBName + "?" + cfg.DBParams
	}
	var err error
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
	log.Printf("[DB] AutoMigrate completed")
}

// Ctx returns a gorm.DB bound to the request context for proper cancellation/timeouts.
func Ctx(c *gin.Context) *gorm.DB {
	if DB == nil {
		return nil
	}
	return DB.WithContext(c.Request.Context())
}

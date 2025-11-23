package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	Port          string
	Env           string
	CorsOrigins   []string
	JWTSecret     string
	JWTTTLMinutes int
	// DB
	DBDriver       string // mysql (only)
	DBDSN          string // optional DSN override (mysql)
	DBHost         string
	DBPort         int
	DBUser         string
	DBPassword     string
	DBName         string
	DBParams       string
	UploadDir      string
	MaxUploadMB    int64
	AdminEmail     string
	AdminPassword  string
	AdminName      string
	TrustedProxies []string
	// Timeouts and telemetry
	RequestTimeoutSeconds int
	SlowRequestMs         int
	// Per-route timeouts (seconds)
	PackagesListTimeoutSeconds    int
	PackageDetailTimeoutSeconds   int
	PackagesOptionsTimeoutSeconds int
}

func Load() *Config {
	// Try loading .env from current and parent directories to allow a single root .env
	// Ensure .env values override any existing env vars in dev
	_ = godotenv.Overload(".env", "../.env", "../../.env")

	cfg := &Config{
		Port:                          getEnv("PORT", "8080"),
		Env:                           getEnv("APP_ENV", "development"),
		CorsOrigins:                   splitAndTrim(getEnv("CORS_ORIGINS", "http://localhost:5173")),
		JWTSecret:                     getEnv("JWT_SECRET", "change-this-in-production"),
		JWTTTLMinutes:                 getEnvAsInt("JWT_TTL_MINUTES", 30),
		DBDriver:                      strings.ToLower(getEnv("DB_DRIVER", "mysql")),
		DBDSN:                         getEnv("DB_DSN", ""),
		DBHost:                        getEnv("DB_HOST", "127.0.0.1"),
		DBPort:                        getEnvAsInt("DB_PORT", 3306),
		DBUser:                        getEnv("DB_USER", "root"),
		DBPassword:                    getEnv("DB_PASSWORD", ""),
		DBName:                        getEnv("DB_NAME", "besttravel"),
		DBParams:                      getEnv("DB_PARAMS", "parseTime=true&charset=utf8mb4&loc=Local"),
		UploadDir:                     getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadMB:                   int64(getEnvAsInt("MAX_UPLOAD_MB", 5)),
		AdminEmail:                    getEnv("ADMIN_EMAIL", "admin@example.com"),
		AdminPassword:                 getEnv("ADMIN_PASSWORD", "admin123"),
		AdminName:                     getEnv("ADMIN_NAME", "Admin"),
		TrustedProxies:                splitAndTrim(getEnv("TRUSTED_PROXIES", "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1,::1")),
		RequestTimeoutSeconds:         getEnvAsInt("REQUEST_TIMEOUT_SECONDS", 10),
		SlowRequestMs:                 getEnvAsInt("SLOW_REQUEST_MS", 500),
		PackagesListTimeoutSeconds:    getEnvAsInt("REQUEST_TIMEOUT_PACKAGES_LIST_SECONDS", 5),
		PackageDetailTimeoutSeconds:   getEnvAsInt("REQUEST_TIMEOUT_PACKAGE_DETAIL_SECONDS", 8),
		PackagesOptionsTimeoutSeconds: getEnvAsInt("REQUEST_TIMEOUT_PACKAGES_OPTIONS_SECONDS", 5),
	}

	if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
		log.Fatalf("failed to create upload dir: %v", err)
	}
	// Enforce MySQL only
	if cfg.DBDriver != "mysql" {
		log.Fatalf("unsupported DB_DRIVER '%s' - only 'mysql' is supported now", cfg.DBDriver)
	}

	// Basic production hardening: require strong JWT secret and non-default admin creds
	if cfg.Env == "production" {
		if cfg.JWTSecret == "change-this-in-production" || len(cfg.JWTSecret) < 32 {
			log.Fatalf("insecure JWT_SECRET in production; set a strong secret (>=32 chars)")
		}
		if cfg.AdminEmail == "admin@example.com" || cfg.AdminPassword == "admin123" {
			log.Fatalf("default admin credentials detected in production; set ADMIN_EMAIL and ADMIN_PASSWORD")
		}
	}

	return cfg
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getEnvAsInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return def
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	res := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			res = append(res, p)
		}
	}
	return res
}

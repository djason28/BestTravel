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
	JWTIssuer     string
	JWTAudience   string
	// DB
	DBDriver       string // mysql | turso
	DBDSN          string // optional DSN override (mysql)
	DBHost         string
	DBPort         int
	DBUser         string
	DBPassword     string
	DBName         string
	DBParams       string
	TursoURL       string
	TursoAuthToken string
	// R2 storage
	R2AccountID       string
	R2AccessKeyID     string
	R2SecretAccessKey string
	R2Bucket          string
	R2PublicBaseURL   string
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
	// Iteratively attempt to load .env from possible locations.
	// godotenv.Overload stops on first error, so we call it per-file if the file exists.
	for _, p := range []string{".env", "../.env", "../../.env"} {
		if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
			if err2 := godotenv.Overload(p); err2 != nil {
				log.Printf("[Config] failed loading %s: %v", p, err2)
			} else {
				log.Printf("[Config] loaded env file: %s", p)
			}
		}
	}

	cfg := &Config{
		Port:                          getEnv("PORT", "8080"),
		Env:                           getEnv("APP_ENV", "development"),
		CorsOrigins:                   splitAndTrim(getEnv("CORS_ORIGINS", "http://localhost:5173")),
		JWTSecret:                     getEnv("JWT_SECRET", "change-this-in-production"),
		JWTTTLMinutes:                 getEnvAsInt("JWT_TTL_MINUTES", 30),
		JWTIssuer:                     getEnv("JWT_ISSUER", "besttravel-api"),
		JWTAudience:                   getEnv("JWT_AUDIENCE", "besttravel-client"),
		DBDriver:                      strings.ToLower(getEnv("DB_DRIVER", "sqlite")),
		DBDSN:                         getEnv("DB_DSN", ""),
		DBHost:                        getEnv("DB_HOST", "127.0.0.1"),
		DBPort:                        getEnvAsInt("DB_PORT", 3306),
		DBUser:                        getEnv("DB_USER", "root"),
		DBPassword:                    getEnv("DB_PASSWORD", ""),
		DBName:                        getEnv("DB_NAME", "besttravel"),
		DBParams:                      getEnv("DB_PARAMS", "parseTime=true&charset=utf8mb4&loc=Local"),
		TursoURL:                      getEnv("TURSO_DATABASE_URL", ""),
		TursoAuthToken:                getEnv("TURSO_AUTH_TOKEN", ""),
		R2AccountID:                   getEnv("R2_ACCOUNT_ID", ""),
		R2AccessKeyID:                 getEnv("R2_ACCESS_KEY_ID", ""),
		R2SecretAccessKey:             getEnv("R2_SECRET_ACCESS_KEY", ""),
		R2Bucket:                      getEnv("R2_BUCKET", ""),
		R2PublicBaseURL:               strings.TrimRight(getEnv("R2_PUBLIC_BASE_URL", ""), "/"),
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

	switch cfg.DBDriver {
	case "mysql":
		if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
			log.Fatalf("failed to create upload dir: %v", err)
		}
		log.Printf("[Config] DB user=%s host=%s port=%d name=%s driver=%s", cfg.DBUser, cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBDriver)
	case "turso":
		if cfg.TursoURL == "" || cfg.TursoAuthToken == "" {
			log.Fatalf("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required when DB_DRIVER=turso")
		}
		if cfg.R2Bucket == "" || cfg.R2AccessKeyID == "" || cfg.R2SecretAccessKey == "" || cfg.R2AccountID == "" {
			log.Printf("[Config] R2 credentials missing; uploads will fail unless R2_* vars are set")
		}
		log.Printf("[Config] DB driver=%s", cfg.DBDriver)
	case "sqlite":
		dbPath := cfg.DBName
		if dbPath == "" {
			dbPath = "./data/besttravel.db"
		}
		log.Printf("[Config] DB driver=%s file=%s", cfg.DBDriver, dbPath)
	default:
		log.Fatalf("unsupported DB_DRIVER '%s' - use 'mysql', 'turso', or 'sqlite'", cfg.DBDriver)
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

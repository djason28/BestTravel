package router

import (
	"log"
	"net/http"
	"time"

	"besttravel/internal/config"
	"besttravel/internal/controllers"
	"besttravel/internal/middleware"
	"besttravel/internal/utils"

	"github.com/gin-gonic/gin"
)

func Setup(cfg *config.Config) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	// Prevent client IP spoofing by configuring trusted proxies explicitly
	if err := r.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		log.Fatalf("failed to set trusted proxies: %v", err)
	}
	r.Use(gin.Recovery())
	r.Use(middleware.RequestID())
	r.Use(middleware.StructuredLogger())
	r.Use(middleware.SecureHeaders())
	r.Use(middleware.CORS(cfg))
	r.Use(middleware.RateLimit(10, 20)) // 10 req/sec with burst 20 per IP
	// Global timeout (configurable)
	r.Use(middleware.RequestTimeout(time.Duration(cfg.RequestTimeoutSeconds) * time.Second))
	// Slow request logger (configurable threshold)
	r.Use(middleware.SlowRequest(time.Duration(cfg.SlowRequestMs) * time.Millisecond))
	// Limit multipart form memory to prevent large uploads in memory
	r.MaxMultipartMemory = (int64(cfg.MaxUploadMB) + 1) * 1024 * 1024

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Static uploads (no directory listing)
	r.StaticFS("/uploads", utils.NoListFS{FS: http.Dir(cfg.UploadDir)})

	api := r.Group("/api")
	{
		// Auth
		auth := controllers.NewAuthController(cfg)
		api.POST("/auth/login", middleware.LoginRateLimit(), auth.Login)
		api.POST("/auth/refresh", auth.Refresh)

		apiAuth := api.Group("/auth")
		apiAuth.Use(middleware.AuthRequired(cfg))
		{
			apiAuth.POST("/logout", auth.Logout)
			apiAuth.GET("/me", auth.Me)
		}

		// Packages
		pkg := controllers.NewPackageController(cfg)
		api.GET("/packages", middleware.RequestTimeout(time.Duration(cfg.PackagesListTimeoutSeconds)*time.Second), middleware.OptionalAuth(cfg), pkg.GetAll)
		api.GET("/packages/:id", middleware.RequestTimeout(time.Duration(cfg.PackageDetailTimeoutSeconds)*time.Second), middleware.OptionalAuth(cfg), pkg.GetByID)
		api.GET("/packages/slug/:slug", middleware.RequestTimeout(time.Duration(cfg.PackageDetailTimeoutSeconds)*time.Second), middleware.OptionalAuth(cfg), pkg.GetBySlug)
		api.GET("/packages/options", middleware.RequestTimeout(time.Duration(cfg.PackagesOptionsTimeoutSeconds)*time.Second), middleware.OptionalAuth(cfg), pkg.GetOptions)
		api.POST("/packages/:id/view", pkg.IncrementView)

		adminPackages := api.Group("/packages")
		adminPackages.Use(middleware.AuthRequired(cfg), middleware.AdminOnly())
		{
			adminPackages.POST("", pkg.Create)
			adminPackages.PUT(":id", pkg.Update)
			adminPackages.DELETE(":id", pkg.Delete)
		}

		// Inquiries
		inq := controllers.NewInquiryController(cfg)
		api.POST("/inquiries", inq.Create)
		adminInq := api.Group("/inquiries")
		adminInq.Use(middleware.AuthRequired(cfg), middleware.AdminOnly())
		{
			adminInq.GET("", inq.GetAll)
			adminInq.PATCH(":id/status", inq.UpdateStatus)
		}

		// Dashboard
		dash := controllers.NewDashboardController(cfg)
		adminDash := api.Group("/dashboard")
		adminDash.Use(middleware.AuthRequired(cfg), middleware.AdminOnly())
		{
			adminDash.GET("/stats", dash.GetStats)
		}

		// Contact
		contact := controllers.NewContactController(cfg)
		api.POST("/contact", contact.Send)

		// Upload
		upload := controllers.NewUploadController(cfg)
		adminUpload := api.Group("/upload")
		adminUpload.Use(middleware.AuthRequired(cfg), middleware.AdminOnly())
		{
			adminUpload.POST("/image", upload.UploadImage)
			adminUpload.DELETE("/image", upload.DeleteImage)
		}
	}

	return r
}

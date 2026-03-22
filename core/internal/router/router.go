package router

import (
	"log"
	"time"

	"besttravel/internal/config"
	"besttravel/internal/controllers"
	"besttravel/internal/database"
	"besttravel/internal/middleware"
	"besttravel/internal/repository"

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

	// --- Wire up repositories ---
	userRepo := repository.NewGormUserRepo(database.DB)
	authRepo := repository.NewGormAuthRepo(database.DB)
	pkgRepo := repository.NewGormPackageRepo(database.DB)
	carRepo := repository.NewGormCarRepo(database.DB)
	inqRepo := repository.NewGormInquiryRepo(database.DB)
	dashRepo := repository.NewGormDashboardRepo(database.DB)

	// Health check enhanced (uptime + db)
	r.GET("/health", controllers.Health)

	api := r.Group("/api")
	{
		// Auth
		auth := controllers.NewAuthController(cfg, userRepo, authRepo)
		api.POST("/auth/login", middleware.LoginRateLimit(), auth.Login)
		api.POST("/auth/refresh", auth.Refresh)

		apiAuth := api.Group("/auth")
		apiAuth.Use(middleware.AuthRequired(cfg, authRepo))
		{
			apiAuth.POST("/logout", auth.Logout)
			apiAuth.GET("/me", auth.Me)
			userCtrl := controllers.NewUserController(userRepo)
			apiAuth.PUT("/profile", userCtrl.UpdateProfile)
			apiAuth.PUT("/password", userCtrl.ChangePassword)
		}

		// Users (admin management)
		userCtrl := controllers.NewUserController(userRepo)
		adminUsers := api.Group("/users")
		adminUsers.Use(middleware.AuthRequired(cfg, authRepo), middleware.AdminOnly())
		{
			adminUsers.GET("", userCtrl.GetAll)
			adminUsers.POST("", userCtrl.Create)
			adminUsers.DELETE(":id", userCtrl.Delete)
		}

		// Packages
		pkg := controllers.NewPackageController(cfg, pkgRepo)
		api.GET("/packages", middleware.RequestTimeout(time.Duration(cfg.PackagesListTimeoutSeconds)*time.Second), middleware.OptionalAuth(cfg, authRepo), pkg.GetAll)
		api.GET("/packages/:id", middleware.RequestTimeout(time.Duration(cfg.PackageDetailTimeoutSeconds)*time.Second), middleware.OptionalAuth(cfg, authRepo), pkg.GetByID)
		api.GET("/packages/slug/:slug", middleware.RequestTimeout(time.Duration(cfg.PackageDetailTimeoutSeconds)*time.Second), middleware.OptionalAuth(cfg, authRepo), pkg.GetBySlug)
		api.GET("/packages/options", middleware.RequestTimeout(time.Duration(cfg.PackagesOptionsTimeoutSeconds)*time.Second), middleware.OptionalAuth(cfg, authRepo), pkg.GetOptions)
		api.POST("/packages/:id/view", pkg.IncrementView)

		adminPackages := api.Group("/packages")
		adminPackages.Use(middleware.AuthRequired(cfg, authRepo), middleware.AdminOnly())
		{
			adminPackages.POST("", pkg.Create)
			adminPackages.PUT(":id", pkg.Update)
			adminPackages.DELETE(":id", pkg.Delete)
		}

		// Inquiries
		inq := controllers.NewInquiryController(cfg, inqRepo)
		api.POST("/inquiries", middleware.RateLimit(1, 3), inq.Create) // 1 req/sec, burst 3
		adminInq := api.Group("/inquiries")
		adminInq.Use(middleware.AuthRequired(cfg, authRepo), middleware.AdminOnly())
		{
			adminInq.GET("", inq.GetAll)
			adminInq.PATCH(":id/status", inq.UpdateStatus)
		}

		// Cars
		car := controllers.NewCarController(cfg, carRepo)
		api.GET("/cars", middleware.OptionalAuth(cfg, authRepo), car.GetAll)
		api.GET("/cars/:id", car.GetByID)
		api.GET("/cars/slug/:slug", car.GetBySlug)
		api.POST("/cars/:id/view", car.IncrementView)
		adminCars := api.Group("/cars")
		adminCars.Use(middleware.AuthRequired(cfg, authRepo), middleware.AdminOnly())
		{
			adminCars.POST("", car.Create)
			adminCars.PUT(":id", car.Update)
			adminCars.DELETE(":id", car.Delete)
		}

		// Dashboard
		dash := controllers.NewDashboardController(cfg, dashRepo)
		adminDash := api.Group("/dashboard")
		adminDash.Use(middleware.AuthRequired(cfg, authRepo), middleware.AdminOnly())
		{
			adminDash.GET("/stats", dash.GetStats)
		}

		// Contact
		contact := controllers.NewContactController(cfg, inqRepo)
		api.POST("/contact", middleware.RateLimit(1, 3), contact.Send) // 1 req/sec, burst 3

		// Upload
		upload := controllers.NewUploadController(cfg)
		r.GET("/images/*filepath", upload.ServeImage)
		adminUpload := api.Group("/upload")
		adminUpload.Use(middleware.AuthRequired(cfg, authRepo), middleware.AdminOnly())
		{
			adminUpload.POST("/image", upload.UploadImage)
			adminUpload.DELETE("/image", upload.DeleteImage)
		}
	}

	return r
}

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"besttravel/internal/config"
	"besttravel/internal/database"
	"besttravel/internal/logger"
	"besttravel/internal/middleware"
	"besttravel/internal/models"

	"besttravel/internal/router"
	"besttravel/internal/utils"

	"github.com/google/uuid"
)

func main() {
	cfg := config.Load()
	logger.Init(cfg.Env)
	database.Init(cfg)
	database.EnsureIndexes(cfg.DBDriver)

	// seed admin
	seedAdmin(cfg)

	r := router.Setup(cfg)
	// bind to 0.0.0.0 so the server is reachable from other devices on the same LAN
	addr := "0.0.0.0:" + cfg.Port
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// start rate limiter cleanup goroutine
	middleware.StartLimiterCleanup(10 * time.Minute)

	// run server in goroutine
	go func() {
		log.Printf("Server running on %s (listening on %s)", "0.0.0.0", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	// graceful shutdown on interrupt/terminate
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	log.Println("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("server shutdown error: %v", err)
	}
	log.Println("server stopped cleanly")
}

func seedAdmin(cfg *config.Config) {
	var count int64
	database.DB.Model(&models.User{}).Where("email = ?", cfg.AdminEmail).Count(&count)
	if count > 0 {
		return
	}
	ph, err := utils.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Fatalf("failed to hash admin password: %v", err)
	}
	u := models.User{ID: uuid.NewString(), Email: cfg.AdminEmail, PasswordHash: ph, Name: cfg.AdminName, Role: "admin"}
	if err := database.DB.Create(&u).Error; err != nil {
		log.Fatalf("failed to seed admin user: %v", err)
	}
}

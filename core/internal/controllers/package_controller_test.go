package controllers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"besttravel/internal/config"
	"besttravel/internal/database"
	"besttravel/internal/models"
	"besttravel/internal/router"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	dsn := os.Getenv("TEST_DB_DSN")
	if dsn == "" {
		// Skip if test DSN not provided to avoid hardcoding credentials
		t.Skip("TEST_DB_DSN not set; skipping package controller DB test")
	}
	var err error
	database.DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("mysql open: %v", err)
	}
	if err := database.DB.AutoMigrate(&models.Package{}, &models.PackageImage{}, &models.ItineraryItem{}, &models.Inquiry{}, &models.User{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
}

func seedPackages(t *testing.T) {
	p := models.Package{ID: "1", Title: "Island Tour", TitleZh: "岛屿游", Slug: "island-tour", Status: "published"}
	if err := database.DB.Create(&p).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}
}

func TestGetAllLangZh(t *testing.T) {
	setupTestDB(t)
	seedPackages(t)
	cfg := &config.Config{Env: "test", TrustedProxies: []string{}}
	r := router.Setup(cfg)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/packages?lang=zh", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", w.Code)
	}
	var body struct {
		Data    []models.Package `json:"data"`
		Success bool             `json:"success"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !body.Success || len(body.Data) != 1 {
		t.Fatalf("unexpected body: %+v", body)
	}
	if body.Data[0].Title != "岛屿游" {
		t.Fatalf("expected zh title applied got %s", body.Data[0].Title)
	}
}

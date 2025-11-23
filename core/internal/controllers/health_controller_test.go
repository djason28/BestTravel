package controllers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"besttravel/internal/config"
	"besttravel/internal/router"
)

func TestHealth(t *testing.T) {
	cfg := &config.Config{Env: "test", TrustedProxies: []string{}, UploadDir: "./uploads"}
	r := router.Setup(cfg)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/health", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", w.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	if body["status"] == nil || body["uptimeSeconds"] == nil || body["db"] == nil {
		t.Fatalf("missing fields in health response: %+v", body)
	}
}

package controllers

import (
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"besttravel/internal/config"

	"github.com/gin-gonic/gin"
)

type UploadController struct{ cfg *config.Config }

func NewUploadController(cfg *config.Config) *UploadController { return &UploadController{cfg: cfg} }

func (h *UploadController) UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		fail(c, http.StatusBadRequest, "file is required")
		return
	}
	folder := c.PostForm("folder")
	if folder == "" {
		folder = "packages"
	}
	// Sanitize folder to a single safe directory name (prevent traversal and nested paths)
	if strings.Contains(folder, "..") || strings.HasPrefix(folder, "/") || strings.ContainsAny(folder, "\\:") || strings.Contains(folder, "/") {
		fail(c, http.StatusBadRequest, "invalid folder")
		return
	}

	if !isImage(file) {
		fail(c, http.StatusBadRequest, "invalid image type")
		return
	}
	maxBytes := h.cfg.MaxUploadMB * 1024 * 1024
	if file.Size > maxBytes {
		fail(c, http.StatusBadRequest, "file too large")
		return
	}

	dir := filepath.Join(h.cfg.UploadDir, folder)
	_ = os.MkdirAll(dir, 0755)
	name := strings.ReplaceAll(time.Now().Format("20060102_150405.000000000"), ":", "") + "_" + filepath.Base(file.Filename)
	path := filepath.Join(dir, name)
	// Ensure final path stays under upload dir
	base := filepath.Clean(h.cfg.UploadDir) + string(os.PathSeparator)
	final := filepath.Clean(path)
	if !strings.HasPrefix(final, base) {
		fail(c, http.StatusBadRequest, "invalid path")
		return
	}
	if err := c.SaveUploadedFile(file, path); err != nil {
		fail(c, http.StatusInternalServerError, "failed to save file")
		return
	}
	// Build absolute URL
	scheme := "http"
	if xfp := c.Request.Header.Get("X-Forwarded-Proto"); xfp != "" {
		scheme = xfp
	}
	url := scheme + "://" + c.Request.Host + "/uploads/" + folder + "/" + name
	ok(c, gin.H{"url": url})
}

func (h *UploadController) DeleteImage(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required,url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "invalid url")
		return
	}
	// Convert URL to file path under upload dir
	idx := strings.Index(req.URL, "/uploads/")
	if idx == -1 {
		fail(c, http.StatusBadRequest, "invalid url")
		return
	}
	rel := req.URL[idx+len("/uploads/"):]
	path := filepath.Join(h.cfg.UploadDir, rel)
	if !strings.HasPrefix(filepath.Clean(path), filepath.Clean(h.cfg.UploadDir)) {
		fail(c, http.StatusBadRequest, "invalid path")
		return
	}
	if err := os.Remove(path); err != nil {
		fail(c, http.StatusInternalServerError, "failed to delete")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func isImage(f *multipart.FileHeader) bool {
	// quick extension check
	lower := strings.ToLower(f.Filename)
	if !(strings.HasSuffix(lower, ".jpg") || strings.HasSuffix(lower, ".jpeg") || strings.HasSuffix(lower, ".png") || strings.HasSuffix(lower, ".webp")) {
		return false
	}
	// content sniffing
	rf, err := f.Open()
	if err != nil {
		return false
	}
	defer rf.Close()
	header := make([]byte, 512)
	n, _ := io.ReadFull(rf, header)
	contentType := http.DetectContentType(header[:n])
	switch contentType {
	case "image/jpeg", "image/png", "image/webp":
		return true
	default:
		return false
	}
}

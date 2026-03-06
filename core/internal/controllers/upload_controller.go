package controllers

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"
	"time"

	"besttravel/internal/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
)

type UploadController struct {
	cfg *config.Config
	r2  *s3.Client
}

func NewUploadController(cfg *config.Config) *UploadController {
	client := newR2Client(cfg)
	return &UploadController{cfg: cfg, r2: client}
}

func (h *UploadController) UploadImage(c *gin.Context) {
	if h.r2 == nil {
		fail(c, http.StatusServiceUnavailable, "R2 is not configured")
		return
	}
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

	safeFolder := sanitizeFilename(folder)
	safeName := sanitizeFilename(file.Filename)
	key := fmt.Sprintf("%s/%d-%s", safeFolder, time.Now().UnixMilli(), safeName)

	opened, err := file.Open()
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to read file")
		return
	}
	defer opened.Close()

	_, err = h.r2.PutObject(c.Request.Context(), &s3.PutObjectInput{
		Bucket:      aws.String(h.cfg.R2Bucket),
		Key:         aws.String(key),
		Body:        opened,
		ContentType: aws.String(file.Header.Get("Content-Type")),
	})
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to upload file")
		return
	}

	url := "/images/" + key
	ok(c, gin.H{"url": url})
}

func (h *UploadController) DeleteImage(c *gin.Context) {
	if h.r2 == nil {
		fail(c, http.StatusServiceUnavailable, "R2 is not configured")
		return
	}
	var req struct {
		URL string `json:"url" binding:"required,url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "invalid url")
		return
	}
	key := extractR2Key(req.URL, h.cfg.R2PublicBaseURL)
	if key == "" {
		fail(c, http.StatusBadRequest, "invalid url")
		return
	}
	_, err := h.r2.DeleteObject(c.Request.Context(), &s3.DeleteObjectInput{
		Bucket: aws.String(h.cfg.R2Bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to delete")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *UploadController) ServeImage(c *gin.Context) {
	if h.r2 == nil {
		c.String(http.StatusServiceUnavailable, "R2 is not configured")
		return
	}
	key := strings.TrimPrefix(c.Param("filepath"), "/")
	if key == "" {
		c.String(http.StatusBadRequest, "Invalid filename")
		return
	}
	obj, err := h.r2.GetObject(c.Request.Context(), &s3.GetObjectInput{
		Bucket: aws.String(h.cfg.R2Bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		c.String(http.StatusNotFound, "Image not found")
		return
	}
	defer obj.Body.Close()
	if obj.ContentType != nil {
		c.Header("Content-Type", *obj.ContentType)
	}
	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	_, _ = io.Copy(c.Writer, obj.Body)
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

func sanitizeFilename(input string) string {
	cleaned := strings.TrimSpace(input)
	if cleaned == "" {
		return ""
	}
	cleaned = strings.ReplaceAll(cleaned, "\\", "/")
	parts := strings.Split(cleaned, "/")
	cleaned = parts[len(parts)-1]
	return strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r
		case r >= 'A' && r <= 'Z':
			return r
		case r >= '0' && r <= '9':
			return r
		case r == '.' || r == '_' || r == '-':
			return r
		default:
			return '_'
		}
	}, cleaned)
}

func extractR2Key(rawURL, publicBase string) string {
	if publicBase != "" && strings.HasPrefix(rawURL, publicBase+"/") {
		return strings.TrimPrefix(rawURL, publicBase+"/")
	}
	if u, err := url.Parse(rawURL); err == nil {
		if strings.HasPrefix(u.Path, "/images/") {
			return strings.TrimPrefix(u.Path, "/images/")
		}
	}
	if idx := strings.Index(rawURL, "/images/"); idx != -1 {
		return strings.TrimPrefix(rawURL[idx:], "/images/")
	}
	return ""
}

func newR2Client(cfg *config.Config) *s3.Client {
	if cfg.R2Bucket == "" || cfg.R2AccountID == "" || cfg.R2AccessKeyID == "" || cfg.R2SecretAccessKey == "" {
		return nil
	}
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.R2AccountID)
	awsCfg, err := awsconfig.LoadDefaultConfig(
		context.Background(),
		awsconfig.WithRegion("auto"),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.R2AccessKeyID, cfg.R2SecretAccessKey, "")),
		awsconfig.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
			func(service, region string, options ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: endpoint, HostnameImmutable: true}, nil
			},
		)),
	)
	if err != nil {
		return nil
	}
	return s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true
	})
}

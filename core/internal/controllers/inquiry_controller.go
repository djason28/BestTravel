package controllers

import (
	"net/http"
	"strings"
	"time"

	"besttravel/internal/config"
	"besttravel/internal/database"
	"besttravel/internal/models"
	"besttravel/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InquiryController struct{ cfg *config.Config }

func NewInquiryController(cfg *config.Config) *InquiryController { return &InquiryController{cfg: cfg} }

type inquiryReq struct {
	PackageID     string `json:"packageId"`
	PackageTitle  string `json:"packageTitle"`
	Name          string `json:"name" binding:"required"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
	Message       string `json:"message" binding:"required"`
	Participants  int    `json:"participants"`
	PreferredDate string `json:"preferredDate"`
	Source        string `json:"source"`
}

var allowedInquirySources = map[string]struct{}{
	"form": {}, "detail": {}, "contact": {}, "whatsapp": {}, "car": {},
}

func (h *InquiryController) Create(c *gin.Context) {
	var req inquiryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "invalid request body")
		return
	}
	// Field length caps — prevent large-payload DoS
	if len(req.Name) > 120 || len(req.Message) > 4000 ||
		len(req.Email) > 254 || len(req.Phone) > 30 || len(req.PackageTitle) > 200 {
		fail(c, http.StatusBadRequest, "one or more fields exceed allowed length")
		return
	}
	// Whitelist source to prevent arbitrary string injection
	source := req.Source
	if source == "" {
		source = "form"
	} else if _, ok := allowedInquirySources[source]; !ok {
		source = "form" // silently normalise unknown source
	}
	inq := models.Inquiry{
		ID:            uuid.NewString(),
		PackageID:     req.PackageID,
		PackageTitle:  req.PackageTitle,
		Name:          req.Name,
		Email:         req.Email,
		Phone:         req.Phone,
		Message:       req.Message,
		Participants:  req.Participants,
		PreferredDate: req.PreferredDate,
		Source:        source,
		Status:        "new",
	}
	if err := database.Ctx(c).Create(&inq).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to create inquiry")
		return
	}
	// increment inquiry count on package
	if req.PackageID != "" {
		database.Ctx(c).Model(&models.Package{}).Where("id = ?", req.PackageID).UpdateColumn("inquiry_count", gorm.Expr("inquiry_count + 1"))
	}
	created(c, inq)
}

func (h *InquiryController) GetAll(c *gin.Context) {
	qBase := buildInquiryFilters(database.Ctx(c).Model(&models.Inquiry{}), c)
	page, limit := utils.GetPageLimit(c, 10)
	var total int64
	var items []models.Inquiry

	utils.ParallelCountAndList(
		qBase,
		func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Offset((page - 1) * limit).Limit(limit)
		},
		&items,
		&total,
	)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items, "pagination": gin.H{
		"page": page, "limit": limit, "total": total, "totalPages": (int((total + int64(limit) - 1) / int64(limit))),
	}})
}

// buildInquiryFilters centralizes filtering logic for inquiries
func buildInquiryFilters(q *gorm.DB, c *gin.Context) *gorm.DB {
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if src := c.Query("source"); src != "" {
		q = q.Where("source = ?", src)
	}
	if pkg := c.Query("packageId"); pkg != "" {
		q = q.Where("package_id = ?", pkg)
	}
	if email := c.Query("email"); email != "" {
		like := "%" + strings.ToLower(email) + "%"
		q = q.Where("lower(email) LIKE ?", like)
	}
	if from := c.Query("dateFrom"); from != "" {
		if t, err := time.Parse("2006-01-02", from); err == nil {
			q = q.Where("created_at >= ?", t)
		}
	}
	if to := c.Query("dateTo"); to != "" {
		if t, err := time.Parse("2006-01-02", to); err == nil {
			// include the entire 'to' day by adding 24h
			q = q.Where("created_at < ?", t.Add(24*time.Hour))
		}
	}
	return q
}

type statusReq struct {
	Status string `json:"status" binding:"required,oneof=new contacted converted closed"`
}

func (h *InquiryController) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var req statusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "invalid status")
		return
	}
	if err := database.Ctx(c).Model(&models.Inquiry{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to update status")
		return
	}
	var inq models.Inquiry
	database.Ctx(c).First(&inq, "id = ?", id)
	ok(c, inq)
}

package controllers

import (
	"besttravel/internal/config"
	"besttravel/internal/repository"

	"github.com/gin-gonic/gin"
)

type DashboardController struct {
	cfg      *config.Config
	dashRepo repository.DashboardRepository
}

func NewDashboardController(cfg *config.Config, dashRepo repository.DashboardRepository) *DashboardController {
	return &DashboardController{cfg: cfg, dashRepo: dashRepo}
}

func (h *DashboardController) GetStats(c *gin.Context) {
	totalPkg, published, drafts, totalInq, totalViews := repository.DashboardStats(
		c.Request.Context(), h.dashRepo,
	)
	conversionRate := 0.0
	if totalPkg > 0 {
		conversionRate = float64(totalInq) / float64(totalPkg) * 100
	}
	ok(c, gin.H{
		"totalPackages":      totalPkg,
		"publishedPackages":  published,
		"draftPackages":      drafts,
		"totalInquiries":     totalInq,
		"newInquiries":       0,
		"convertedInquiries": 0,
		"totalViews":         totalViews,
		"conversionRate":     conversionRate,
	})
}

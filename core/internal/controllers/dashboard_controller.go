package controllers

import (
	"besttravel/internal/config"
	"besttravel/internal/database"
	"besttravel/internal/models"
	"sync"

	"github.com/gin-gonic/gin"
)

type DashboardController struct{ cfg *config.Config }

func NewDashboardController(cfg *config.Config) *DashboardController {
	return &DashboardController{cfg: cfg}
}

func (h *DashboardController) GetStats(c *gin.Context) {
	var totalPackages, published, drafts int64
	var totalInquiries int64
	var totalViews int64

	var wg sync.WaitGroup
	wg.Add(5)
	go func() {
		defer wg.Done()
		database.Ctx(c).Model(&models.Package{}).Count(&totalPackages)
	}()
	go func() {
		defer wg.Done()
		database.Ctx(c).Model(&models.Package{}).Where("status = ?", "published").Count(&published)
	}()
	go func() {
		defer wg.Done()
		database.Ctx(c).Model(&models.Package{}).Where("status = ?", "draft").Count(&drafts)
	}()
	go func() {
		defer wg.Done()
		database.Ctx(c).Model(&models.Inquiry{}).Count(&totalInquiries)
	}()
	go func() {
		defer wg.Done()
		database.Ctx(c).Model(&models.Package{}).Select("COALESCE(SUM(view_count),0)").Scan(&totalViews)
	}()
	wg.Wait()

	conversionRate := 0.0
	if totalPackages > 0 {
		conversionRate = float64(totalInquiries) / float64(totalPackages) * 100
	}
	ok(c, gin.H{
		"totalPackages":      totalPackages,
		"publishedPackages":  published,
		"draftPackages":      drafts,
		"totalInquiries":     totalInquiries,
		"newInquiries":       0,
		"convertedInquiries": 0,
		"totalViews":         totalViews,
		"conversionRate":     conversionRate,
	})
}

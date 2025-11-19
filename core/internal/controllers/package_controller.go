package controllers

import (
	"net/http"
	"sort"
	"strconv"
	"strings"

	"besttravel/internal/config"
	"besttravel/internal/database"
	"besttravel/internal/models"
	"besttravel/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PackageController struct{ cfg *config.Config }

func NewPackageController(cfg *config.Config) *PackageController { return &PackageController{cfg: cfg} }

type packageForm struct {
	Title            string                 `json:"title" binding:"required,min=3"`
	Slug             string                 `json:"slug"`
	Description      string                 `json:"description"`
	ShortDescription string                 `json:"shortDescription"`
	Price            int64                  `json:"price" binding:"gte=0"`
	Currency         string                 `json:"currency"`
	Duration         int                    `json:"duration" binding:"gte=0"`
	DurationUnit     string                 `json:"durationUnit"`
	Categories       []string               `json:"categories"`
	Destination      string                 `json:"destination"`
	Included         []string               `json:"included"`
	Excluded         []string               `json:"excluded"`
	Highlights       []string               `json:"highlights"`
	Availability     string                 `json:"availability"`
	MaxParticipants  int                    `json:"maxParticipants" binding:"gte=0"`
	Featured         bool                   `json:"featured"`
	Status           string                 `json:"status"`
	Images           []models.PackageImage  `json:"images"`
	Itinerary        []models.ItineraryItem `json:"itinerary"`
}

func (h *PackageController) GetAll(c *gin.Context) {
	// Show only published to non-admin
	isAdmin := false
	if role, ok := c.Get("role"); ok && role == "admin" {
		isAdmin = true
	}

	qBase := buildPackageFilters(database.Ctx(c).Model(&models.Package{}), c, isAdmin)

	page, limit := utils.GetPageLimit(c, 12)
	var total int64
	var items []models.Package
	sortBy := applySort(c.Query("sortBy"))

	utils.ParallelCountAndList(
		qBase,
		func(db *gorm.DB) *gorm.DB {
			return db.Preload("Images").Preload("Itinerary").
				Offset((page - 1) * limit).Limit(limit).Order(sortBy)
		},
		&items,
		&total,
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    items,
		"pagination": gin.H{
			"page": page, "limit": limit, "total": total, "totalPages": (int((total + int64(limit) - 1) / int64(limit))),
		},
	})
}

func (h *PackageController) GetByID(c *gin.Context) {
	id := c.Param("id")
	var pkg models.Package
	if err := database.Ctx(c).Preload("Images").Preload("Itinerary").First(&pkg, "id = ?", id).Error; err != nil {
		fail(c, http.StatusNotFound, "not found")
		return
	}
	ok(c, pkg)
}

func (h *PackageController) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	q := database.Ctx(c).Preload("Images").Preload("Itinerary")
	isAdmin := false
	if role, ok := c.Get("role"); ok && role == "admin" {
		isAdmin = true
	}
	if !isAdmin {
		q = q.Where("status = ?", "published")
	}
	var pkg models.Package
	if err := q.First(&pkg, "slug = ?", slug).Error; err != nil {
		fail(c, http.StatusNotFound, "not found")
		return
	}
	ok(c, pkg)
}

func (h *PackageController) Create(c *gin.Context) {
	var req packageForm
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validation
	if req.Price < 1 {
		fail(c, http.StatusBadRequest, "price must be at least 1")
		return
	}
	if req.MaxParticipants < 1 {
		fail(c, http.StatusBadRequest, "max participants must be at least 1")
		return
	}
	if req.Currency != "IDR" && req.Currency != "USD" && req.Currency != "SGD" && req.Currency != "" {
		fail(c, http.StatusBadRequest, "currency must be IDR, USD, or SGD")
		return
	}

	// Note: do not log incoming categories to avoid leaking request data in logs
	slug := req.Slug
	if slug == "" {
		slug = utils.Slugify(req.Title)
	}
	// ensure unique slug
	slug = ensureUniqueSlug(c, slug)
	pkg := models.Package{
		ID:               uuid.NewString(),
		Title:            req.Title,
		Slug:             slug,
		Description:      req.Description,
		ShortDescription: req.ShortDescription,
		Price:            req.Price,
		Currency:         normalizeCurrency(choose(req.Currency, "IDR")),
		Duration:         req.Duration,
		DurationUnit:     choose(req.DurationUnit, "days"),
		Categories:       models.StringArray(req.Categories),
		Destination:      req.Destination,
		Included:         models.StringArray(req.Included),
		Excluded:         models.StringArray(req.Excluded),
		Highlights:       models.StringArray(req.Highlights),
		Availability:     req.Availability,
		MaxParticipants:  req.MaxParticipants,
		Featured:         req.Featured,
		Status:           choose(req.Status, "draft"),
	}
	for i := range req.Images {
		req.Images[i].ID = uuid.NewString()
		req.Images[i].PackageID = pkg.ID
	}
	for i := range req.Itinerary {
		req.Itinerary[i].ID = uuid.NewString()
		req.Itinerary[i].PackageID = pkg.ID
	}
	pkg.Images = req.Images
	pkg.Itinerary = req.Itinerary

	if err := database.Ctx(c).Create(&pkg).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to create")
		return
	}
	created(c, pkg)
}

func (h *PackageController) Update(c *gin.Context) {
	id := c.Param("id")
	var req packageForm
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validation
	if req.Price != 0 && req.Price < 1 {
		fail(c, http.StatusBadRequest, "price must be at least 1")
		return
	}
	if req.MaxParticipants != 0 && req.MaxParticipants < 1 {
		fail(c, http.StatusBadRequest, "max participants must be at least 1")
		return
	}
	if req.Currency != "" && req.Currency != "IDR" && req.Currency != "USD" && req.Currency != "SGD" {
		fail(c, http.StatusBadRequest, "currency must be IDR, USD, or SGD")
		return
	}

	// Note: do not log incoming categories to avoid leaking request data in logs
	var pkg models.Package
	if err := database.Ctx(c).Preload("Images").Preload("Itinerary").First(&pkg, "id = ?", id).Error; err != nil {
		fail(c, http.StatusNotFound, "not found")
		return
	}
	if req.Title != "" {
		pkg.Title = req.Title
	}
	if req.Slug != "" {
		newSlug := utils.Slugify(req.Slug)
		if newSlug != pkg.Slug {
			pkg.Slug = ensureUniqueSlug(c, newSlug)
		}
	}
	pkg.Description = req.Description
	pkg.ShortDescription = req.ShortDescription
	if req.Price != 0 {
		pkg.Price = req.Price
	}
	if req.Currency != "" {
		pkg.Currency = normalizeCurrency(req.Currency)
	}
	if req.Duration != 0 {
		pkg.Duration = req.Duration
	}
	if req.DurationUnit != "" {
		pkg.DurationUnit = req.DurationUnit
	}
	if len(req.Categories) > 0 {
		pkg.Categories = models.StringArray(req.Categories)
	}
	if req.Destination != "" {
		pkg.Destination = req.Destination
	}
	if len(req.Included) > 0 {
		pkg.Included = models.StringArray(req.Included)
	}
	if len(req.Excluded) > 0 {
		pkg.Excluded = models.StringArray(req.Excluded)
	}
	if len(req.Highlights) > 0 {
		pkg.Highlights = models.StringArray(req.Highlights)
	}
	if req.Availability != "" {
		pkg.Availability = req.Availability
	}
	if req.MaxParticipants != 0 {
		pkg.MaxParticipants = req.MaxParticipants
	}
	if req.Status != "" {
		pkg.Status = req.Status
	}
	pkg.Featured = req.Featured

	// Replace associations if provided
	if req.Images != nil {
		database.Ctx(c).Where("package_id = ?", pkg.ID).Delete(&models.PackageImage{})
		for i := range req.Images {
			req.Images[i].ID = uuid.NewString()
			req.Images[i].PackageID = pkg.ID
		}
		pkg.Images = req.Images
	}
	if req.Itinerary != nil {
		database.Ctx(c).Where("package_id = ?", pkg.ID).Delete(&models.ItineraryItem{})
		for i := range req.Itinerary {
			req.Itinerary[i].ID = uuid.NewString()
			req.Itinerary[i].PackageID = pkg.ID
		}
		pkg.Itinerary = req.Itinerary
	}

	if err := database.Ctx(c).Session(&gorm.Session{FullSaveAssociations: true}).Save(&pkg).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to update")
		return
	}
	ok(c, pkg)
}

func (h *PackageController) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := database.Ctx(c).Delete(&models.Package{}, "id = ?", id).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to delete")
		return
	}
	ok(c, gin.H{"message": "deleted"})
}

func (h *PackageController) IncrementView(c *gin.Context) {
	id := c.Param("id")
	database.Ctx(c).Model(&models.Package{}).Where("id = ?", id).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetOptions returns distinct filter options (categories, destinations, currencies, availability)
func (h *PackageController) GetOptions(c *gin.Context) {
	// Non-admin users should only see options from published packages
	isAdmin := false
	if role, ok := c.Get("role"); ok && role == "admin" {
		isAdmin = true
	}

	base := database.Ctx(c).Model(&models.Package{})
	if !isAdmin {
		base = base.Where("status = ?", "published")
	}

	// Distinct destinations
	var destinations []string
	if err := base.Distinct().Where("destination <> ''").Pluck("destination", &destinations).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to load destinations")
		return
	}

	// Distinct currencies
	var currencies []string
	if err := base.Distinct().Where("currency <> ''").Pluck("currency", &currencies).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to load currencies")
		return
	}

	// Distinct availability
	var availability []string
	if err := base.Distinct().Where("availability <> ''").Pluck("availability", &availability).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to load availability")
		return
	}

	// Aggregate categories from JSON arrays
	var rows []struct{ Categories models.StringArray }
	if err := base.Select("categories").Find(&rows).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to load categories")
		return
	}
	catSet := map[string]struct{}{}
	for _, r := range rows {
		for _, cat := range r.Categories {
			s := strings.TrimSpace(strings.ToLower(cat))
			if s == "" {
				continue
			}
			catSet[s] = struct{}{}
		}
	}
	categories := make([]string, 0, len(catSet))
	for k := range catSet {
		categories = append(categories, k)
	}

	// Simple sort for stable UI
	sort.Strings(categories)
	sort.Strings(destinations)
	sort.Strings(currencies)
	sort.Strings(availability)

	ok(c, gin.H{
		"categories":   categories,
		"destinations": destinations,
		"currencies":   currencies,
		"availability": availability,
	})
}

func choose(v, def string) string {
	if v == "" {
		return def
	}
	return v
}

// ensureUniqueSlug appends -n if slug already exists
func ensureUniqueSlug(c *gin.Context, base string) string {
	slug := base
	var count int64
	i := 1
	for {
		database.Ctx(c).Model(&models.Package{}).Where("slug = ?", slug).Count(&count)
		if count == 0 {
			return slug
		}
		i++
		slug = base + "-" + strconv.Itoa(i)
	}
}

// buildPackageFilters applies query string filters to the base query in a reusable way
func buildPackageFilters(q *gorm.DB, c *gin.Context, isAdmin bool) *gorm.DB {
	// Respect explicit status query param (e.g., status=published from frontend)
	if statusParam := c.Query("status"); statusParam != "" {
		q = q.Where("status = ?", statusParam)
	} else if !isAdmin {
		// Default: non-admin sees only published
		q = q.Where("status = ?", "published")
	}

	if s := c.Query("search"); s != "" {
		like := "%" + strings.ToLower(s) + "%"
		q = q.Where("lower(title) LIKE ? OR lower(description) LIKE ?", like, like)
	}
	// Category filters: support single category and multiple categories with any/all mode
	cats := utils.QueryStringSlice(c, "categories")
	if len(cats) > 0 {
		mode := strings.ToLower(strings.TrimSpace(c.Query("categoryMode")))
		if mode == "all" {
			// all categories must be present (AND)
			for _, cat := range cats {
				q = q.Where("categories LIKE ?", "%\""+cat+"\"%")
			}
		} else {
			// default: any (OR)
			// build OR clauses
			or := q
			first := true
			for _, cat := range cats {
				like := "%\"" + cat + "\"%"
				if first {
					or = or.Where("categories LIKE ?", like)
					first = false
				} else {
					or = or.Or("categories LIKE ?", like)
				}
			}
			q = or
		}
	} else if v := c.Query("category"); v != "" {
		// categories stored as JSON array in TEXT; match by token
		q = q.Where("categories LIKE ?", "%\""+v+"\"%")
	}
	if v := c.Query("destination"); v != "" {
		q = q.Where("destination = ?", v)
	}
	// Multi-destination support (OR)
	if dests := utils.QueryStringSlice(c, "destinations"); len(dests) > 0 {
		q = q.Where("destination IN ?", dests)
	}
	// Additional filters
	if v := c.Query("currency"); v != "" {
		q = q.Where("currency = ?", strings.ToUpper(strings.TrimSpace(v)))
	}
	// Multi-currency support (OR)
	if currs := utils.QueryStringSlice(c, "currencies"); len(currs) > 0 {
		up := make([]string, 0, len(currs))
		for _, ccy := range currs {
			up = append(up, strings.ToUpper(strings.TrimSpace(ccy)))
		}
		q = q.Where("currency IN ?", up)
	}
	if v := c.Query("availability"); v != "" {
		q = q.Where("availability = ?", v)
	}
	// Featured filters: featuredOnly / notFeatured shortcuts, then generic featured
	if b, ok := utils.QueryBool(c, "featuredOnly"); ok && b {
		q = q.Where("featured = ?", true)
	} else if b, ok := utils.QueryBool(c, "notFeatured"); ok && b {
		q = q.Where("featured = ?", false)
	} else if b, ok := utils.QueryBool(c, "featured"); ok {
		q = q.Where("featured = ?", b)
	}
	if minPrice, ok := utils.QueryInt64(c, "priceMin"); ok {
		if minPrice < 1 {
			minPrice = 1
		}
		q = q.Where("price >= ?", minPrice)
	}
	if maxPrice, ok := utils.QueryInt64(c, "priceMax"); ok {
		if maxPrice >= 1 {
			q = q.Where("price <= ?", maxPrice)
		}
	}
	if minDur, ok := utils.QueryInt(c, "durationMin"); ok {
		if minDur < 1 {
			minDur = 1
		}
		q = q.Where("duration >= ?", minDur)
	}
	if maxDur, ok := utils.QueryInt(c, "durationMax"); ok {
		if maxDur >= 1 {
			q = q.Where("duration <= ?", maxDur)
		}
	}
	if minPart, ok := utils.QueryInt(c, "participantsMin"); ok {
		if minPart < 1 {
			minPart = 1
		}
		q = q.Where("max_participants >= ?", minPart)
	}
	if maxPart, ok := utils.QueryInt(c, "participantsMax"); ok {
		if maxPart >= 1 {
			q = q.Where("max_participants <= ?", maxPart)
		}
	}
	return q
}

package controllers

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"besttravel/internal/cache"
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
	Title              string                 `json:"title" binding:"required,min=3"`
	TitleZh            string                 `json:"titleZh"`
	Slug               string                 `json:"slug"`
	Description        string                 `json:"description"`
	DescriptionZh      string                 `json:"descriptionZh"`
	ShortDescription   string                 `json:"shortDescription"`
	ShortDescriptionZh string                 `json:"shortDescriptionZh"`
	Price              int64                  `json:"price" binding:"gte=0"`
	Currency           string                 `json:"currency"`
	Duration           int                    `json:"duration" binding:"gte=0"`
	DurationUnit       string                 `json:"durationUnit"`
	Categories         []string               `json:"categories"`
	CategoriesZh       []string               `json:"categoriesZh"`
	Destination        string                 `json:"destination"`
	DestinationZh      string                 `json:"destinationZh"`
	Included           []string               `json:"included"`
	IncludedZh         []string               `json:"includedZh"`
	Excluded           []string               `json:"excluded"`
	ExcludedZh         []string               `json:"excludedZh"`
	Highlights         []string               `json:"highlights"`
	HighlightsZh       []string               `json:"highlightsZh"`
	Availability       string                 `json:"availability"`
	AvailabilityZh     string                 `json:"availabilityZh"`
	MaxParticipants    int                    `json:"maxParticipants" binding:"gte=0"`
	Featured           bool                   `json:"featured"`
	Status             string                 `json:"status"`
	Images             []models.PackageImage  `json:"images"`
	Itinerary          []models.ItineraryItem `json:"itinerary"`
}

// PackageDTO exposes a consistent subset of Package fields for API consumers.
// (Chinese language substitution applied before conversion when requested.)
type PackageDTO struct {
	ID               string                `json:"id"`
	Title            string                `json:"title"`
	Slug             string                `json:"slug"`
	ShortDescription string                `json:"shortDescription"`
	Description      string                `json:"description"`
	Price            int64                 `json:"price"`
	Currency         string                `json:"currency"`
	Duration         int                   `json:"duration"`
	DurationUnit     string                `json:"durationUnit"`
	Categories       models.StringArray    `json:"categories"`
	Destination      string                `json:"destination"`
	Included         models.StringArray    `json:"included"`
	Excluded         models.StringArray    `json:"excluded"`
	Highlights       models.StringArray    `json:"highlights"`
	Availability     string                `json:"availability"`
	MaxParticipants  int                   `json:"maxParticipants"`
	Featured         bool                  `json:"featured"`
	Status           string                `json:"status"`
	ViewCount        int64                 `json:"viewCount"`
	InquiryCount     int64                 `json:"inquiryCount"`
	Images           []models.PackageImage `json:"images"`
	// Itinerary only included in detail endpoints; left empty for list (can expand later).
	Itinerary []models.ItineraryItem `json:"itinerary,omitempty"`
}

type PaginationDTO struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

type PackageListResponse struct {
	Data       []PackageDTO  `json:"data"`
	Pagination PaginationDTO `json:"pagination"`
	SortBy     string        `json:"sortBy"`
	Cached     bool          `json:"cached"`
}

func toDTO(p models.Package, includeDetail bool) PackageDTO {
	dto := PackageDTO{
		ID:               p.ID,
		Title:            p.Title,
		Slug:             p.Slug,
		ShortDescription: p.ShortDescription,
		Description:      p.Description,
		Price:            p.Price,
		Currency:         p.Currency,
		Duration:         p.Duration,
		DurationUnit:     p.DurationUnit,
		Categories:       p.Categories,
		Destination:      p.Destination,
		Included:         p.Included,
		Excluded:         p.Excluded,
		Highlights:       p.Highlights,
		Availability:     p.Availability,
		MaxParticipants:  p.MaxParticipants,
		Featured:         p.Featured,
		Status:           p.Status,
		ViewCount:        p.ViewCount,
		InquiryCount:     p.InquiryCount,
		Images:           p.Images,
	}
	if includeDetail {
		dto.Itinerary = p.Itinerary
	}
	return dto
}

func (h *PackageController) GetAll(c *gin.Context) {
	isAdmin := false
	if role, ok := c.Get("role"); ok && role == "admin" {
		isAdmin = true
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	base := database.DB.WithContext(ctx).Model(&models.Package{})
	qBase := buildPackageFilters(base, c, isAdmin)

	page, limit := utils.GetPageLimit(c, 12)
	var total int64
	var items []models.Package
	sortBy, okSort := applySort(c.Query("sortBy"))
	if !okSort {
		fail(c, http.StatusBadRequest, "invalid sortBy")
		return
	}

	// Build stable cache key from essential query params
	rawKey := c.Request.URL.RawQuery + "|admin=" + strconv.FormatBool(isAdmin) + "|lang=" + detectLang(c) + "|page=" + strconv.Itoa(page) + "|limit=" + strconv.Itoa(limit) + "|sort=" + sortBy
	sum := sha1.Sum([]byte(rawKey))
	cacheKey := "pkg:list:" + hex.EncodeToString(sum[:])
	if cachedRaw, ok := cache.GetPackageList(cacheKey); ok {
		if cachedResp, ok2 := cachedRaw.(PackageListResponse); ok2 {
			// Fast path: return cached response
			c.JSON(http.StatusOK, gin.H{"success": true, "data": cachedResp.Data, "pagination": cachedResp.Pagination, "sortBy": cachedResp.SortBy, "cached": true})
			return
		}
	}

	utils.ParallelCountAndList(
		qBase,
		func(db *gorm.DB) *gorm.DB {
			// Only preload Images for listing to avoid N+1 / heavy payload
			return db.Preload("Images").Offset((page - 1) * limit).Limit(limit).Order(sortBy)
		},
		&items,
		&total,
	)

	if detectLang(c) == "zh" {
		for i := range items {
			applyLangZh(&items[i])
		}
	}
	dtoList := make([]PackageDTO, len(items))
	for i, p := range items {
		dtoList[i] = toDTO(p, false)
	}
	resp := PackageListResponse{
		Data:       dtoList,
		Pagination: PaginationDTO{Page: page, Limit: limit, Total: total, TotalPages: int((total + int64(limit) - 1) / int64(limit))},
		SortBy:     sortBy,
		Cached:     false,
	}
	cache.SetPackageList(cacheKey, resp)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": resp.Data, "pagination": resp.Pagination, "sortBy": resp.SortBy, "cached": false})
}

func (h *PackageController) GetByID(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()
	var pkg models.Package
	if err := database.DB.WithContext(ctx).Preload("Images").Preload("Itinerary").First(&pkg, "id = ?", id).Error; err != nil {
		fail(c, http.StatusNotFound, "not found")
		return
	}
	if detectLang(c) == "zh" {
		applyLangZh(&pkg)
	}
	ok(c, toDTO(pkg, true))
}

func (h *PackageController) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()
	q := database.DB.WithContext(ctx).Preload("Images").Preload("Itinerary")
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
	if detectLang(c) == "zh" {
		applyLangZh(&pkg)
	}
	ok(c, toDTO(pkg, true))
}

func (h *PackageController) Create(c *gin.Context) {
	var req packageForm
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errors": FormatValidationError(err)})
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
	if req.Currency != "" && !IsValidCurrency(normalizeCurrency(req.Currency)) {
		fail(c, http.StatusBadRequest, "invalid currency")
		return
	}

	// Note: do not log incoming categories to avoid leaking request data in logs
	slug := req.Slug
	if slug == "" {
		slug = utils.Slugify(req.Title)
	}
	// ensure unique slug
	slug = ensureUniqueSlug(c, slug)
	// Begin transaction for atomic create
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		pkg := models.Package{
			ID:                 uuid.NewString(),
			Title:              req.Title,
			TitleZh:            req.TitleZh,
			Slug:               slug,
			Description:        req.Description,
			DescriptionZh:      req.DescriptionZh,
			ShortDescription:   req.ShortDescription,
			ShortDescriptionZh: req.ShortDescriptionZh,
			Price:              req.Price,
			Currency:           normalizeCurrency(choose(req.Currency, "IDR")),
			Duration:           req.Duration,
			DurationUnit:       choose(req.DurationUnit, "days"),
			Categories:         models.StringArray(req.Categories),
			CategoriesZh:       models.StringArray(req.CategoriesZh),
			Destination:        req.Destination,
			DestinationZh:      req.DestinationZh,
			Included:           models.StringArray(req.Included),
			IncludedZh:         models.StringArray(req.IncludedZh),
			Excluded:           models.StringArray(req.Excluded),
			ExcludedZh:         models.StringArray(req.ExcludedZh),
			Highlights:         models.StringArray(req.Highlights),
			HighlightsZh:       models.StringArray(req.HighlightsZh),
			Availability:       req.Availability,
			AvailabilityZh:     req.AvailabilityZh,
			MaxParticipants:    req.MaxParticipants,
			Featured:           req.Featured,
			Status:             choose(req.Status, models.StatusDraft),
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
		if err := tx.Create(&pkg).Error; err != nil {
			return err
		}
		// Invalidate caches (options + list)
		cache.InvalidateOptions()
		cache.InvalidatePackages()
		created(c, toDTO(pkg, true))
		return nil
	})
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to create")
		return
	}
}

func (h *PackageController) Update(c *gin.Context) {
	id := c.Param("id")
	var req packageForm
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errors": FormatValidationError(err)})
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
	if req.Currency != "" && !IsValidCurrency(normalizeCurrency(req.Currency)) {
		fail(c, http.StatusBadRequest, "invalid currency")
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
	if req.TitleZh != "" {
		pkg.TitleZh = req.TitleZh
	}
	if req.Slug != "" {
		newSlug := utils.Slugify(req.Slug)
		if newSlug != pkg.Slug {
			pkg.Slug = ensureUniqueSlug(c, newSlug)
		}
	}
	pkg.Description = req.Description
	if req.DescriptionZh != "" {
		pkg.DescriptionZh = req.DescriptionZh
	}
	pkg.ShortDescription = req.ShortDescription
	if req.ShortDescriptionZh != "" {
		pkg.ShortDescriptionZh = req.ShortDescriptionZh
	}
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
	if len(req.CategoriesZh) > 0 {
		pkg.CategoriesZh = models.StringArray(req.CategoriesZh)
	}
	if req.Destination != "" {
		pkg.Destination = req.Destination
	}
	if req.DestinationZh != "" {
		pkg.DestinationZh = req.DestinationZh
	}
	if len(req.Included) > 0 {
		pkg.Included = models.StringArray(req.Included)
	}
	if len(req.IncludedZh) > 0 {
		pkg.IncludedZh = models.StringArray(req.IncludedZh)
	}
	if len(req.Excluded) > 0 {
		pkg.Excluded = models.StringArray(req.Excluded)
	}
	if len(req.ExcludedZh) > 0 {
		pkg.ExcludedZh = models.StringArray(req.ExcludedZh)
	}
	if len(req.Highlights) > 0 {
		pkg.Highlights = models.StringArray(req.Highlights)
	}
	if len(req.HighlightsZh) > 0 {
		pkg.HighlightsZh = models.StringArray(req.HighlightsZh)
	}
	if req.Availability != "" {
		pkg.Availability = req.Availability
	}
	if req.AvailabilityZh != "" {
		pkg.AvailabilityZh = req.AvailabilityZh
	}
	if req.MaxParticipants != 0 {
		pkg.MaxParticipants = req.MaxParticipants
	}
	if req.Status != "" {
		if !models.IsValidPackageStatus(req.Status) {
			fail(c, http.StatusBadRequest, "invalid status")
			return
		}
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

	// Transaction for update with association replacement
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Session(&gorm.Session{FullSaveAssociations: true}).Save(&pkg).Error; err != nil {
			return err
		}
		cache.InvalidateOptions()
		cache.InvalidatePackages()
		ok(c, toDTO(pkg, true))
		return nil
	})
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to update")
		return
	}
}

func (h *PackageController) Delete(c *gin.Context) {
	id := c.Param("id")
	// Soft delete (DeletedAt) handled automatically by GORM
	if err := database.Ctx(c).Delete(&models.Package{}, "id = ?", id).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to delete")
		return
	}
	cache.InvalidateOptions()
	cache.InvalidatePackages()
	ok(c, gin.H{"message": "deleted"})
}

func (h *PackageController) IncrementView(c *gin.Context) {
	id := c.Param("id")
	database.Ctx(c).Model(&models.Package{}).Where("id = ?", id).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetOptions returns distinct filter options (categories, destinations, currencies, availability)
func (h *PackageController) GetOptions(c *gin.Context) {
	isAdmin := false
	if role, ok := c.Get("role"); ok && role == "admin" {
		isAdmin = true
	}
	lang := detectLang(c)
	key := "options:" + lang + ":" + strconv.FormatBool(isAdmin)
	if cached, okc := cache.Get(key); okc {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": cached, "cached": true})
		return
	}
	base := database.Ctx(c).Model(&models.Package{})
	if !isAdmin {
		base = base.Where("status = ?", "published")
	}
	var destinations []string
	if err := base.Distinct().Where("destination IS NOT NULL AND destination <> ''").Pluck("destination", &destinations).Error; err != nil {
		destinations = []string{}
	}
	var currencies []string
	if err := base.Distinct().Where("currency IS NOT NULL AND currency <> ''").Pluck("currency", &currencies).Error; err != nil {
		currencies = []string{}
	}
	var availability []string
	if err := base.Distinct().Where("availability IS NOT NULL AND availability <> ''").Pluck("availability", &availability).Error; err != nil {
		availability = []string{}
	}
	var rows []struct{ Categories models.StringArray }
	if err := base.Select("COALESCE(NULLIF(categories, ''), '[]') as categories").Find(&rows).Error; err != nil {
		rows = []struct{ Categories models.StringArray }{}
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
	sort.Strings(categories)
	sort.Strings(destinations)
	sort.Strings(currencies)
	sort.Strings(availability)
	if lang == "zh" {
		var zhRows []struct{ CategoriesZh models.StringArray }
		if err := base.Select("COALESCE(NULLIF(categories_zh, ''), '[]') as categories_zh").Find(&zhRows).Error; err == nil {
			zhSet := map[string]struct{}{}
			for _, r := range zhRows {
				for _, cat := range r.CategoriesZh {
					ct := strings.TrimSpace(cat)
					if ct == "" {
						continue
					}
					zhSet[ct] = struct{}{}
				}
			}
			if len(zhSet) > 0 {
				catsZh := make([]string, 0, len(zhSet))
				for k := range zhSet {
					catsZh = append(catsZh, k)
				}
				sort.Strings(catsZh)
				categories = catsZh
			}
		}
		var destZh []string
		if err := base.Distinct().Where("destination_zh IS NOT NULL AND destination_zh <> ''").Pluck("destination_zh", &destZh).Error; err == nil && len(destZh) > 0 {
			destinations = destZh
			sort.Strings(destinations)
		}
		var availZh []string
		if err := base.Distinct().Where("availability_zh IS NOT NULL AND availability_zh <> ''").Pluck("availability_zh", &availZh).Error; err == nil && len(availZh) > 0 {
			availability = availZh
			sort.Strings(availability)
		}
	}
	data := gin.H{"categories": categories, "destinations": destinations, "currencies": currencies, "availability": availability}
	cache.Set(key, data)
	ok(c, data)
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

// applyLangZh copies *_Zh fields into primary fields for response when Chinese requested.
// It leaves IDs and numeric fields untouched. Fallback: if zh field empty, keep original.
func applyLangZh(p *models.Package) {
	if p.TitleZh != "" {
		p.Title = p.TitleZh
	}
	if p.DescriptionZh != "" {
		p.Description = p.DescriptionZh
	}
	if p.ShortDescriptionZh != "" {
		p.ShortDescription = p.ShortDescriptionZh
	}
	if len(p.CategoriesZh) > 0 {
		p.Categories = p.CategoriesZh
	}
	if p.DestinationZh != "" {
		p.Destination = p.DestinationZh
	}
	if len(p.IncludedZh) > 0 {
		p.Included = p.IncludedZh
	}
	if len(p.ExcludedZh) > 0 {
		p.Excluded = p.ExcludedZh
	}
	if len(p.HighlightsZh) > 0 {
		p.Highlights = p.HighlightsZh
	}
	if p.AvailabilityZh != "" {
		p.Availability = p.AvailabilityZh
	}
	// Itinerary items
	for i := range p.Itinerary {
		it := &p.Itinerary[i]
		if it.TitleZh != "" {
			it.Title = it.TitleZh
		}
		if it.DescriptionZh != "" {
			it.Description = it.DescriptionZh
		}
		if len(it.ActivitiesZh) > 0 {
			it.Activities = it.ActivitiesZh
		}
		if len(it.MealsZh) > 0 {
			it.Meals = it.MealsZh
		}
		if it.AccommodationZh != "" {
			it.Accommodation = it.AccommodationZh
		}
	}
}

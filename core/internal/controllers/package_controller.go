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
	"besttravel/internal/repository"
	"besttravel/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PackageController struct {
	cfg  *config.Config
	repo repository.PackageRepository
}

func NewPackageController(cfg *config.Config, repo repository.PackageRepository) *PackageController {
	return &PackageController{cfg: cfg, repo: repo}
}

type packageForm struct {
	Title              string                 `json:"title" binding:"required,min=3"`
	TitleZh            string                 `json:"titleZh"`
	Slug               string                 `json:"slug"`
	Description        string                 `json:"description"`
	DescriptionZh      string                 `json:"descriptionZh"`
	ShortDescription   string                 `json:"shortDescription"`
	ShortDescriptionZh string                 `json:"shortDescriptionZh"`
	Prices             []models.PricePair     `json:"prices"`
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
	MinParticipants    int                    `json:"minParticipants" binding:"gte=0"`
	MaxParticipants    int                    `json:"maxParticipants" binding:"gte=0"`
	Featured           bool                   `json:"featured"`
	Status             string                 `json:"status"`
	Images             []models.PackageImage  `json:"images"`
	Itinerary          []models.ItineraryItem `json:"itinerary"`
}

// PackageDTO exposes a consistent subset of Package fields for API consumers.
// (Chinese language substitution applied before conversion when requested.)
type PackageDTO struct {
	ID                 string                `json:"id"`
	Title              string                `json:"title"`
	TitleZh            string                `json:"titleZh"`
	Slug               string                `json:"slug"`
	ShortDescription   string                `json:"shortDescription"`
	ShortDescriptionZh string                `json:"shortDescriptionZh"`
	Description        string                `json:"description"`
	DescriptionZh      string                `json:"descriptionZh"`
	Price              int64                 `json:"price"`
	Currency           string                `json:"currency"`
	Prices             models.PriceList      `json:"prices"`
	Duration           int                   `json:"duration"`
	DurationUnit       string                `json:"durationUnit"`
	Categories         models.StringArray    `json:"categories"`
	CategoriesZh       models.StringArray    `json:"categoriesZh"`
	Destination        string                `json:"destination"`
	DestinationZh      string                `json:"destinationZh"`
	Included           models.StringArray    `json:"included"`
	IncludedZh         models.StringArray    `json:"includedZh"`
	Excluded           models.StringArray    `json:"excluded"`
	ExcludedZh         models.StringArray    `json:"excludedZh"`
	Highlights         models.StringArray    `json:"highlights"`
	HighlightsZh       models.StringArray    `json:"highlightsZh"`
	Availability       string                `json:"availability"`
	AvailabilityZh     string                `json:"availabilityZh"`
	MinParticipants    int                   `json:"minParticipants"`
	MaxParticipants    int                   `json:"maxParticipants"`
	Featured           bool                  `json:"featured"`
	Status             string                `json:"status"`
	ViewCount          int64                 `json:"viewCount"`
	InquiryCount       int64                 `json:"inquiryCount"`
	Images             []models.PackageImage `json:"images"`
	// Itinerary only included in detail endpoints; left empty for list.
	Itinerary []models.ItineraryItem `json:"itinerary,omitempty"`
	CreatedAt string                 `json:"createdAt"`
	UpdatedAt string                 `json:"updatedAt"`
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
	images := p.Images
	if len(images) == 0 && p.ImageURL != "" {
		images = models.ImageList{
			{
				ID:      "",
				URL:     p.ImageURL,
				Alt:     p.Title,
				Order:   0,
				IsCover: true,
			},
		}
	}
	dto := PackageDTO{
		ID:                 p.ID,
		Title:              p.Title,
		TitleZh:            p.TitleZh,
		Slug:               p.Slug,
		ShortDescription:   p.ShortDescription,
		ShortDescriptionZh: p.ShortDescriptionZh,
		Description:        p.Description,
		DescriptionZh:      p.DescriptionZh,
		Price:              p.Price,
		Currency:           p.Currency,
		Prices:             p.Prices,
		Duration:           p.Duration,
		DurationUnit:       p.DurationUnit,
		Categories:         p.Categories,
		CategoriesZh:       p.CategoriesZh,
		Destination:        p.Destination,
		DestinationZh:      p.DestinationZh,
		Included:           p.Included,
		IncludedZh:         p.IncludedZh,
		Excluded:           p.Excluded,
		ExcludedZh:         p.ExcludedZh,
		Highlights:         p.Highlights,
		HighlightsZh:       p.HighlightsZh,
		Availability:       p.Availability,
		AvailabilityZh:     p.AvailabilityZh,
		MinParticipants:    p.MinParticipants,
		MaxParticipants:    p.MaxParticipants,
		Featured:           p.Featured,
		Status:             p.Status,
		ViewCount:          p.ViewCount,
		InquiryCount:       p.InquiryCount,
		Images:             images,
		CreatedAt:          p.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:          p.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if includeDetail {
		dto.Itinerary = p.Itinerary
	}
	return dto
}

func (h *PackageController) GetAll(c *gin.Context) {
	isAdmin := false
	if role, ok := c.Get("role"); ok && (role == "admin" || role == "editor") {
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

	rawKey := c.Request.URL.RawQuery + "|admin=" + strconv.FormatBool(isAdmin) + "|page=" + strconv.Itoa(page) + "|limit=" + strconv.Itoa(limit) + "|sort=" + sortBy
	sum := sha1.Sum([]byte(rawKey))
	cacheKey := "pkg:list:" + hex.EncodeToString(sum[:])
	if cachedRaw, ok := cache.GetPackageList(cacheKey); ok {
		if cachedResp, ok2 := cachedRaw.(PackageListResponse); ok2 {
			c.JSON(http.StatusOK, gin.H{"success": true, "data": cachedResp.Data, "pagination": cachedResp.Pagination, "sortBy": cachedResp.SortBy, "cached": true})
			return
		}
	}

	utils.ParallelCountAndList(
		qBase,
		func(db *gorm.DB) *gorm.DB {
			return db.Offset((page - 1) * limit).Limit(limit).Order(sortBy)
		},
		&items,
		&total,
	)

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
	pkg, err := h.repo.FindByID(c.Request.Context(), id)
	if err != nil {
		fail(c, http.StatusNotFound, "not found")
		return
	}
	ok(c, toDTO(*pkg, true))
}

func (h *PackageController) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()
	q := database.DB.WithContext(ctx)
	isAdmin := false
	if role, ok := c.Get("role"); ok && (role == "admin" || role == "editor") {
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
	ok(c, toDTO(pkg, true))
}

func (h *PackageController) Create(c *gin.Context) {
	var req packageForm
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errors": FormatValidationError(err)})
		return
	}

	if len(req.Prices) == 0 {
		fail(c, http.StatusBadRequest, "at least one price is required")
		return
	}
	if primaryPrice(req.Prices) < 1 {
		fail(c, http.StatusBadRequest, "price must be at least 1")
		return
	}
	for _, p := range req.Prices {
		if !IsValidCurrency(normalizeCurrency(p.Currency)) {
			fail(c, http.StatusBadRequest, "invalid currency: "+p.Currency)
			return
		}
	}
	if req.MaxParticipants < 1 {
		fail(c, http.StatusBadRequest, "max participants must be at least 1")
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = utils.Slugify(req.Title)
	}
	baseSlug := slug
	firstSlug := ensureUniqueSlug(c, baseSlug)
	var createdPkg models.Package
	var lastErr error
	for attempt := 0; attempt < 5; attempt++ {
		slugCandidate := firstSlug
		if attempt > 0 {
			slugCandidate = baseSlug + "-" + strconv.Itoa(attempt+1)
		}
		lastErr = database.DB.Transaction(func(tx *gorm.DB) error {
			imageURL := ""
			if len(req.Images) > 0 {
				coverIdx := 0
				for i := range req.Images {
					if req.Images[i].ID == "" {
						req.Images[i].ID = uuid.NewString()
					}
					if req.Images[i].IsCover {
						coverIdx = i
					}
				}
				imageURL = req.Images[coverIdx].URL
			}
			for i := range req.Itinerary {
				if req.Itinerary[i].ID == "" {
					req.Itinerary[i].ID = uuid.NewString()
				}
			}
			createdPkg = models.Package{
				ID:                 uuid.NewString(),
				Title:              req.Title,
				TitleZh:            req.TitleZh,
				Slug:               slugCandidate,
				Description:        req.Description,
				DescriptionZh:      req.DescriptionZh,
				ShortDescription:   req.ShortDescription,
				ShortDescriptionZh: req.ShortDescriptionZh,
						Price:              primaryPrice(req.Prices),
						Currency:           primaryCurrency(req.Prices),
						Prices:             models.PriceList(req.Prices),
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
				MinParticipants:    req.MinParticipants,
				MaxParticipants:    req.MaxParticipants,
				Featured:           req.Featured,
				Status:             choose(req.Status, models.StatusDraft),
				ImageURL:           imageURL,
				Images:             req.Images,
				Itinerary:          req.Itinerary,
			}
			if err := tx.Create(&createdPkg).Error; err != nil {
				return err
			}
			return nil
		})
		if lastErr == nil {
			cache.InvalidateOptions()
			cache.InvalidatePackages()
			created(c, toDTO(createdPkg, true))
			return
		}
		if !isSlugConflict(lastErr) {
			break
		}
	}
	fail(c, http.StatusInternalServerError, "failed to create")
}

func (h *PackageController) Update(c *gin.Context) {
	id := c.Param("id")
	var req packageForm
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errors": FormatValidationError(err)})
		return
	}

	if len(req.Prices) > 0 && primaryPrice(req.Prices) < 1 {
		fail(c, http.StatusBadRequest, "price must be at least 1")
		return
	}
	for _, p := range req.Prices {
		if !IsValidCurrency(normalizeCurrency(p.Currency)) {
			fail(c, http.StatusBadRequest, "invalid currency: "+p.Currency)
			return
		}
	}
	if req.MaxParticipants != 0 && req.MaxParticipants < 1 {
		fail(c, http.StatusBadRequest, "max participants must be at least 1")
		return
	}

	var pkg models.Package
	if err := database.Ctx(c).First(&pkg, "id = ?", id).Error; err != nil {
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
	if len(req.Prices) > 0 {
		pkg.Price = primaryPrice(req.Prices)
		pkg.Currency = primaryCurrency(req.Prices)
		pkg.Prices = models.PriceList(req.Prices)
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
	if req.MinParticipants != 0 {
		pkg.MinParticipants = req.MinParticipants
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

	if req.Images != nil {
		for i := range req.Images {
			if req.Images[i].ID == "" {
				req.Images[i].ID = uuid.NewString()
			}
		}
		pkg.Images = req.Images
		if len(req.Images) > 0 {
			coverIdx := 0
			for i := range req.Images {
				if req.Images[i].IsCover {
					coverIdx = i
				}
			}
			pkg.ImageURL = req.Images[coverIdx].URL
		}
	}
	if req.Itinerary != nil {
		for i := range req.Itinerary {
			if req.Itinerary[i].ID == "" {
				req.Itinerary[i].ID = uuid.NewString()
			}
		}
		pkg.Itinerary = req.Itinerary
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&pkg).Error; err != nil {
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
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		fail(c, http.StatusInternalServerError, "failed to delete")
		return
	}
	cache.InvalidateOptions()
	cache.InvalidatePackages()
	ok(c, gin.H{"message": "deleted"})
}

func (h *PackageController) IncrementView(c *gin.Context) {
	id := c.Param("id")
	_ = h.repo.IncrementView(c.Request.Context(), id)
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
	if err := base.Select("COALESCE(NULLIF(categories_json, ''), '[]') as categories").Find(&rows).Error; err != nil {
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
		if err := base.Select("COALESCE(NULLIF(categories_zh_json, ''), '[]') as categories_zh").Find(&zhRows).Error; err == nil {
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

// ensureUniqueSlug appends -n if slug already exists.
// Capped at 100 attempts to prevent unbounded DB queries; falls back to UUID suffix.
func ensureUniqueSlug(c *gin.Context, base string) string {
	slug := base
	var count int64
	for i := 1; i <= 100; i++ {
		database.Ctx(c).Model(&models.Package{}).Where("slug = ?", slug).Count(&count)
		if count == 0 {
			return slug
		}
		slug = base + "-" + strconv.Itoa(i+1)
	}
	return base + "-" + uuid.NewString()[:8]
}

// buildPackageFilters applies query string filters to the base query in a reusable way
func buildPackageFilters(q *gorm.DB, c *gin.Context, isAdmin bool) *gorm.DB {
	if statusParam := c.Query("status"); statusParam != "" {
		q = q.Where("status = ?", statusParam)
	} else if !isAdmin {
		q = q.Where("status = ?", "published")
	}

	if s := c.Query("search"); s != "" {
		like := "%" + escapeLike(strings.ToLower(s)) + "%"
		q = q.Where("lower(title) LIKE ? OR lower(description) LIKE ?", like, like)
	}
	cats := utils.QueryStringSlice(c, "categories")
	if len(cats) > 0 {
		mode := strings.ToLower(strings.TrimSpace(c.Query("categoryMode")))
		if mode == "all" {
			for _, cat := range cats {
				q = q.Where("categories_json LIKE ?", "%\""+escapeLike(cat)+"\"%")
			}
		} else {
			or := q
			first := true
			for _, cat := range cats {
				like := "%\"" + escapeLike(cat) + "\"%"
				if first {
					or = or.Where("categories_json LIKE ?", like)
					first = false
				} else {
					or = or.Or("categories_json LIKE ?", like)
				}
			}
			q = or
		}
	} else if v := c.Query("category"); v != "" {
		q = q.Where("categories_json LIKE ?", "%\""+escapeLike(v)+"\"%")
	}

	if v := c.Query("destination"); v != "" {
		q = q.Where("destination = ?", v)
	}
	if dests := utils.QueryStringSlice(c, "destinations"); len(dests) > 0 {
		q = q.Where("destination IN ?", dests)
	}
	if v := c.Query("currency"); v != "" {
		q = q.Where("currency = ?", strings.ToUpper(strings.TrimSpace(v)))
	}
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

func isSlugConflict(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "UNIQUE constraint failed: packages.slug")
}

// escapeLike escapes SQL LIKE wildcards (%, _, \) to prevent pattern injection.
func escapeLike(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "%", "\\%")
	s = strings.ReplaceAll(s, "_", "\\_")
	return s
}

package controllers

import (
	"context"
	"net/http"
	"strconv"
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

// ---- request form -------------------------------------------------------

type carForm struct {
	Name           string             `json:"name" binding:"required,min=2"`
	NameZh         string             `json:"nameZh"`
	Slug           string             `json:"slug"`
	Description    string             `json:"description"`
	DescriptionZh  string             `json:"descriptionZh"`
	Brand          string             `json:"brand"`
	Model          string             `json:"model"`
	Year           int                `json:"year" binding:"gte=0"`
	Seats          int                `json:"seats" binding:"gte=0"`
	Transmission   string             `json:"transmission"` // automatic | manual
	FuelType       string             `json:"fuelType"`
	Prices         []models.PricePair `json:"prices"`
	PriceUnit      string             `json:"priceUnit"` // day | trip | hour
	MinDays        int                `json:"minDays" binding:"gte=0"`
	WithDriver     bool               `json:"withDriver"`
	Features       []string           `json:"features"`
	FeaturesZh     []string           `json:"featuresZh"`
	Included       []string           `json:"included"`
	IncludedZh     []string           `json:"includedZh"`
	Excluded       []string           `json:"excluded"`
	ExcludedZh     []string           `json:"excludedZh"`
	Images         []models.PackageImage `json:"images"`
	Availability   string             `json:"availability"`
	AvailabilityZh string             `json:"availabilityZh"`
	Status         string             `json:"status"`
	Featured       bool               `json:"featured"`
}

// ---- DTO ----------------------------------------------------------------

type CarDTO struct {
	ID             string                `json:"id"`
	Name           string                `json:"name"`
	NameZh         string                `json:"nameZh"`
	Slug           string                `json:"slug"`
	Description    string                `json:"description"`
	DescriptionZh  string                `json:"descriptionZh"`
	Brand          string                `json:"brand"`
	Model          string                `json:"model"`
	Year           int                   `json:"year"`
	Seats          int                   `json:"seats"`
	Transmission   string                `json:"transmission"`
	FuelType       string                `json:"fuelType"`
	Prices         models.PriceList      `json:"prices"`
	Price          int64                 `json:"price"`
	Currency       string                `json:"currency"`
	PriceUnit      string                `json:"priceUnit"`
	MinDays        int                   `json:"minDays"`
	WithDriver     bool                  `json:"withDriver"`
	Features       models.StringArray    `json:"features"`
	FeaturesZh     models.StringArray    `json:"featuresZh"`
	Included       models.StringArray    `json:"included"`
	IncludedZh     models.StringArray    `json:"includedZh"`
	Excluded       models.StringArray    `json:"excluded"`
	ExcludedZh     models.StringArray    `json:"excludedZh"`
	Availability   string                `json:"availability"`
	AvailabilityZh string                `json:"availabilityZh"`
	Status         string                `json:"status"`
	Featured       bool                  `json:"featured"`
	ViewCount      int64                 `json:"viewCount"`
	InquiryCount   int64                 `json:"inquiryCount"`
	Images         []models.PackageImage `json:"images"`
	CreatedAt      string                `json:"createdAt"`
	UpdatedAt      string                `json:"updatedAt"`
}

type CarListResponse struct {
	Data       []CarDTO     `json:"data"`
	Pagination PaginationDTO `json:"pagination"`
}

func toCarDTO(c models.Car) CarDTO {
	images := c.Images
	if len(images) == 0 && c.ImageURL != "" {
		images = models.ImageList{{URL: c.ImageURL, Alt: c.Name, IsCover: true}}
	}
	prices := c.Prices
	if len(prices) == 0 {
		prices = models.PriceList{{Amount: c.Price, Currency: c.Currency}}
	}
	return CarDTO{
		ID:             c.ID,
		Name:           c.Name,
		NameZh:         c.NameZh,
		Slug:           c.Slug,
		Description:    c.Description,
		DescriptionZh:  c.DescriptionZh,
		Brand:          c.Brand,
		Model:          c.Model,
		Year:           c.Year,
		Seats:          c.Seats,
		Transmission:   c.Transmission,
		FuelType:       c.FuelType,
		Prices:         prices,
		Price:          c.Price,
		Currency:       c.Currency,
		PriceUnit:      c.PriceUnit,
		MinDays:        c.MinDays,
		WithDriver:     c.WithDriver,
		Features:       c.Features,
		FeaturesZh:     c.FeaturesZh,
		Included:       c.Included,
		IncludedZh:     c.IncludedZh,
		Excluded:       c.Excluded,
		ExcludedZh:     c.ExcludedZh,
		Availability:   c.Availability,
		AvailabilityZh: c.AvailabilityZh,
		Status:         c.Status,
		Featured:       c.Featured,
		ViewCount:      c.ViewCount,
		InquiryCount:   c.InquiryCount,
		Images:         images,
		CreatedAt:      c.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:      c.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// ---- controller ---------------------------------------------------------

type CarController struct{ cfg *config.Config }

func NewCarController(cfg *config.Config) *CarController {
	return &CarController{cfg: cfg}
}

// GET /api/cars
func (h *CarController) GetAll(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second) // Match PackageController timeout style, slightly longer just in case
	defer cancel()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	// offset := (page - 1) * limit // Calculated inside listBuilder now

	// Use database.DB directly with context, similar to PackageController
	db := database.DB.WithContext(ctx)
	q := db.Model(&models.Car{}).Where("deleted_at IS NULL")

	// Filters
	if s := c.Query("status"); s != "" {
		q = q.Where("status = ?", strings.ToLower(s))
	} else {
		// public: only published; admin gets all
		if !isAdmin(c) {
			q = q.Where("status = ?", "published")
		}
	}
	if f := c.Query("featured"); f == "true" {
		q = q.Where("featured = ?", true)
	}
	if s := c.Query("search"); s != "" {
		like := "%" + s + "%"
		q = q.Where("name LIKE ? OR brand LIKE ? OR description LIKE ?", like, like, like)
	}

	// Additional Filters
	if t := c.Query("transmission"); t != "" {
		q = q.Where("transmission = ?", t)
	}
	if d := c.Query("withDriver"); d != "" {
		switch d {
		case "yes":
			q = q.Where("with_driver = ?", 1)
		case "no":
			q = q.Where("with_driver = ?", 0)
		}
	}

	var total int64
	var cars []models.Car

	// Use parallel execution for Count and Find
	errChan := make(chan error, 2)
	go func() {
		if err := q.Session(&gorm.Session{}).Count(&total).Error; err != nil {
			errChan <- err
		} else {
			errChan <- nil
		}
	}()
	go func() {
		if err := q.Session(&gorm.Session{}).Order("created_at DESC").Offset((page - 1) * limit).Limit(limit).Find(&cars).Error; err != nil {
			errChan <- err
		} else {
			errChan <- nil
		}
	}()

	for i := 0; i < 2; i++ {
		if err := <-errChan; err != nil {
			fail(c, http.StatusInternalServerError, "failed to fetch cars")
			return
		}
	}

	dtos := make([]CarDTO, len(cars))
	for i, car := range cars {
		dtos[i] = toCarDTO(car)
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    dtos,
		"pagination": PaginationDTO{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

// GET /api/cars/:id
func (h *CarController) GetByID(c *gin.Context) {
	var car models.Car
	if err := database.Ctx(c).First(&car, "id = ?", c.Param("id")).Error; err != nil {
		fail(c, http.StatusNotFound, "not found")
		return
	}
	ok(c, toCarDTO(car))
}

// GET /api/cars/slug/:slug
func (h *CarController) GetBySlug(c *gin.Context) {
	var car models.Car
	if err := database.Ctx(c).First(&car, "slug = ?", c.Param("slug")).Error; err != nil {
		fail(c, http.StatusNotFound, "not found")
		return
	}
	ok(c, toCarDTO(car))
}

// POST /api/cars/:id/view
func (h *CarController) IncrementView(c *gin.Context) {
	database.Ctx(c).Model(&models.Car{}).Where("id = ?", c.Param("id")).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1))
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// POST /api/cars  (admin)
func (h *CarController) Create(c *gin.Context) {
	var req carForm
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

	slug := req.Slug
	if slug == "" {
		slug = utils.Slugify(req.Name)
	}
	baseSlug := slug
	var createdCar models.Car
	var lastErr error
	for attempt := 0; attempt < 5; attempt++ {
		candidate := baseSlug
		if attempt > 0 {
			candidate = baseSlug + "-" + strconv.Itoa(attempt+1)
		}
		lastErr = database.DB.Transaction(func(tx *gorm.DB) error {
			imageURL := ""
			for i := range req.Images {
				if req.Images[i].ID == "" {
					req.Images[i].ID = uuid.NewString()
				}
				if req.Images[i].IsCover {
					imageURL = req.Images[i].URL
				}
			}
			if imageURL == "" && len(req.Images) > 0 {
				imageURL = req.Images[0].URL
			}
			createdCar = models.Car{
				ID:             uuid.NewString(),
				Name:           req.Name,
				NameZh:         req.NameZh,
				Slug:           candidate,
				Description:    req.Description,
				DescriptionZh:  req.DescriptionZh,
				Brand:          req.Brand,
				Model:          req.Model,
				Year:           req.Year,
				Seats:          req.Seats,
				Transmission:   chooseStr(req.Transmission, "automatic"),
				FuelType:       req.FuelType,
				Prices:         models.PriceList(req.Prices),
				Price:          primaryPrice(req.Prices),
				Currency:       primaryCurrency(req.Prices),
				PriceUnit:      chooseStr(req.PriceUnit, "day"),
				MinDays:        max1(req.MinDays),
				WithDriver:     req.WithDriver,
				Features:       models.StringArray(req.Features),
				FeaturesZh:     models.StringArray(req.FeaturesZh),
				Included:       models.StringArray(req.Included),
				IncludedZh:     models.StringArray(req.IncludedZh),
				Excluded:       models.StringArray(req.Excluded),
				ExcludedZh:     models.StringArray(req.ExcludedZh),
				Images:         models.ImageList(req.Images),
				ImageURL:       imageURL,
				Availability:   req.Availability,
				AvailabilityZh: req.AvailabilityZh,
				Status:         chooseStr(req.Status, models.CarStatusDraft),
				Featured:       req.Featured,
			}
			return tx.Create(&createdCar).Error
		})
		if lastErr == nil {
			created(c, toCarDTO(createdCar))
			return
		}
		if !isSlugConflict(lastErr) {
			break
		}
	}
	fail(c, http.StatusInternalServerError, "failed to create car")
}

// PUT /api/cars/:id  (admin)
func (h *CarController) Update(c *gin.Context) {
	id := c.Param("id")
	var req carForm
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errors": FormatValidationError(err)})
		return
	}

	var car models.Car
	if err := database.Ctx(c).First(&car, "id = ?", id).Error; err != nil {
		fail(c, http.StatusNotFound, "not found")
		return
	}

	if req.Name != "" {
		car.Name = req.Name
	}
	car.NameZh = req.NameZh
	car.Description = req.Description
	car.DescriptionZh = req.DescriptionZh
	if req.Brand != "" {
		car.Brand = req.Brand
	}
	if req.Model != "" {
		car.Model = req.Model
	}
	if req.Year != 0 {
		car.Year = req.Year
	}
	if req.Seats != 0 {
		car.Seats = req.Seats
	}
	if req.Transmission != "" {
		car.Transmission = req.Transmission
	}
	if req.FuelType != "" {
		car.FuelType = req.FuelType
	}
	if len(req.Prices) > 0 {
		car.Prices = models.PriceList(req.Prices)
		car.Price = primaryPrice(req.Prices)
		car.Currency = primaryCurrency(req.Prices)
	}
	if req.PriceUnit != "" {
		car.PriceUnit = req.PriceUnit
	}
	if req.MinDays > 0 {
		car.MinDays = req.MinDays
	}
	car.WithDriver = req.WithDriver
	car.Features = models.StringArray(req.Features)
	car.FeaturesZh = models.StringArray(req.FeaturesZh)
	if len(req.Included) >= 0 {
		car.Included = models.StringArray(req.Included)
	}
	if len(req.Excluded) >= 0 {
		car.Excluded = models.StringArray(req.Excluded)
	}
	if len(req.IncludedZh) >= 0 {
		car.IncludedZh = models.StringArray(req.IncludedZh)
	}
	if len(req.ExcludedZh) >= 0 {
		car.ExcludedZh = models.StringArray(req.ExcludedZh)
	}
	if req.Images != nil {
		for i := range req.Images {
			if req.Images[i].ID == "" {
				req.Images[i].ID = uuid.NewString()
			}
		}
		car.Images = models.ImageList(req.Images)
		if len(req.Images) > 0 {
			for _, img := range req.Images {
				if img.IsCover {
					car.ImageURL = img.URL
					break
				}
			}
			if car.ImageURL == "" {
				car.ImageURL = req.Images[0].URL
			}
		}
	}
	car.Availability = req.Availability
	car.AvailabilityZh = req.AvailabilityZh
	if req.Status != "" {
		if !models.IsValidCarStatus(req.Status) {
			fail(c, http.StatusBadRequest, "invalid status")
			return
		}
		car.Status = req.Status
	}
	car.Featured = req.Featured

	if err := database.Ctx(c).Save(&car).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to update car")
		return
	}
	ok(c, toCarDTO(car))
}

// DELETE /api/cars/:id  (admin)
func (h *CarController) Delete(c *gin.Context) {
	if err := database.Ctx(c).Delete(&models.Car{}, "id = ?", c.Param("id")).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to delete")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ---- helpers (local to car controller) ----------------------------------

func chooseStr(v, def string) string {
	if strings.TrimSpace(v) == "" {
		return def
	}
	return v
}

func max1(v int) int {
	if v < 1 {
		return 1
	}
	return v
}

func isAdmin(c *gin.Context) bool {
	role, _ := c.Get("userRole")
	return role == "admin" || role == "editor"
}

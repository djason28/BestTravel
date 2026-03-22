package repository

import (
	"context"
	"time"

	"besttravel/internal/models"

	"gorm.io/gorm"
)

// ---------- common opts ---------------------------------------------------

// ListOpts holds generic list/filter options used across repositories.
type ListOpts struct {
	Page   int
	Limit  int
	Order  string // e.g. "created_at DESC"
	Status string
}

// ---------- interfaces ---------------------------------------------------

// PackageRepository abstracts all Package-related data access.
type PackageRepository interface {
	FindAll(ctx context.Context, q *gorm.DB, page, limit int) ([]models.Package, int64, error)
	FindByID(ctx context.Context, id string) (*models.Package, error)
	FindBySlug(ctx context.Context, slug string) (*models.Package, error)
	Create(ctx context.Context, pkg *models.Package) error
	Update(ctx context.Context, pkg *models.Package) error
	Delete(ctx context.Context, id string) error
	IncrementView(ctx context.Context, id string) error
	CountBySlug(ctx context.Context, slug string) (int64, error)
	GetFilterOptions(ctx context.Context) (categories, destinations, currencies, availability []string, err error)
}

// CarRepository abstracts all Car-related data access.
type CarRepository interface {
	FindAll(ctx context.Context, q *gorm.DB, page, limit int) ([]models.Car, int64, error)
	FindByID(ctx context.Context, id string) (*models.Car, error)
	FindBySlug(ctx context.Context, slug string) (*models.Car, error)
	Create(ctx context.Context, car *models.Car) error
	Update(ctx context.Context, car *models.Car) error
	Delete(ctx context.Context, id string) error
	IncrementView(ctx context.Context, id string) error
	CountBySlug(ctx context.Context, slug string) (int64, error)
}

// InquiryRepository abstracts Inquiry data access.
type InquiryRepository interface {
	FindAll(ctx context.Context, q *gorm.DB, page, limit int) ([]models.Inquiry, int64, error)
	Create(ctx context.Context, inq *models.Inquiry) error
	UpdateStatus(ctx context.Context, id, status string) error
	FindByID(ctx context.Context, id string) (*models.Inquiry, error)
	IncrementPackageInquiryCount(ctx context.Context, packageID string) error
}

// UserRepository abstracts User data access.
type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByID(ctx context.Context, id string) (*models.User, error)
	FindAll(ctx context.Context) ([]models.User, error)
	Create(ctx context.Context, user *models.User) error
	Save(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id string) error
	CountByEmail(ctx context.Context, email string) (int64, error)
	FindByEmailExcluding(ctx context.Context, email, excludeID string) (*models.User, error)
}

// AuthRepository abstracts token blacklist operations.
type AuthRepository interface {
	BlacklistToken(ctx context.Context, jti string, expiresAt time.Time) error
	IsTokenBlacklisted(ctx context.Context, jti string) bool
}

// DashboardRepository abstracts dashboard statistics queries.
type DashboardRepository interface {
	CountPackages(ctx context.Context) (int64, error)
	CountPackagesByStatus(ctx context.Context, status string) (int64, error)
	CountInquiries(ctx context.Context) (int64, error)
	SumPackageViews(ctx context.Context) (int64, error)
}

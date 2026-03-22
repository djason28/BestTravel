package repository

import (
	"context"
	"sync"
	"time"

	"besttravel/internal/models"

	"gorm.io/gorm"
)

type gormAuthRepo struct{ db *gorm.DB }

// NewGormAuthRepo creates a new GORM-backed AuthRepository.
func NewGormAuthRepo(db *gorm.DB) AuthRepository { return &gormAuthRepo{db: db} }

func (r *gormAuthRepo) BlacklistToken(ctx context.Context, jti string, expiresAt time.Time) error {
	return r.db.WithContext(ctx).Create(&models.TokenBlacklist{
		JTI:       jti,
		ExpiresAt: expiresAt,
	}).Error
}

func (r *gormAuthRepo) IsTokenBlacklisted(ctx context.Context, jti string) bool {
	var count int64
	r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("jti = ?", jti).Count(&count)
	return count > 0
}

// --- Dashboard ---

type gormDashboardRepo struct{ db *gorm.DB }

// NewGormDashboardRepo creates a new GORM-backed DashboardRepository.
func NewGormDashboardRepo(db *gorm.DB) DashboardRepository { return &gormDashboardRepo{db: db} }

func (r *gormDashboardRepo) CountPackages(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Package{}).Count(&count).Error
	return count, err
}

func (r *gormDashboardRepo) CountPackagesByStatus(ctx context.Context, status string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Package{}).Where("status = ?", status).Count(&count).Error
	return count, err
}

func (r *gormDashboardRepo) CountInquiries(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Inquiry{}).Count(&count).Error
	return count, err
}

func (r *gormDashboardRepo) SumPackageViews(ctx context.Context) (int64, error) {
	var total int64
	err := r.db.WithContext(ctx).Model(&models.Package{}).Select("COALESCE(SUM(view_count),0)").Scan(&total).Error
	return total, err
}

// DashboardStats runs all counts in parallel and returns the results.
func DashboardStats(ctx context.Context, repo DashboardRepository) (totalPkg, published, drafts, totalInq, totalViews int64) {
	var wg sync.WaitGroup
	wg.Add(5)
	go func() { defer wg.Done(); totalPkg, _ = repo.CountPackages(ctx) }()
	go func() { defer wg.Done(); published, _ = repo.CountPackagesByStatus(ctx, "published") }()
	go func() { defer wg.Done(); drafts, _ = repo.CountPackagesByStatus(ctx, "draft") }()
	go func() { defer wg.Done(); totalInq, _ = repo.CountInquiries(ctx) }()
	go func() { defer wg.Done(); totalViews, _ = repo.SumPackageViews(ctx) }()
	wg.Wait()
	return
}

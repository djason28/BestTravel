package repository

import (
	"context"
	"sync"

	"besttravel/internal/models"

	"gorm.io/gorm"
)

type gormPackageRepo struct{ db *gorm.DB }

// NewGormPackageRepo creates a new GORM-backed PackageRepository.
func NewGormPackageRepo(db *gorm.DB) PackageRepository { return &gormPackageRepo{db: db} }

func (r *gormPackageRepo) FindAll(ctx context.Context, q *gorm.DB, page, limit int) ([]models.Package, int64, error) {
	var total int64
	var items []models.Package

	var wg sync.WaitGroup
	var countErr, listErr error
	wg.Add(2)
	go func() {
		defer wg.Done()
		countErr = q.WithContext(ctx).Count(&total).Error
	}()
	go func() {
		defer wg.Done()
		listErr = q.WithContext(ctx).Offset((page - 1) * limit).Limit(limit).Find(&items).Error
	}()
	wg.Wait()
	if countErr != nil {
		return nil, 0, countErr
	}
	if listErr != nil {
		return nil, 0, listErr
	}
	return items, total, nil
}

func (r *gormPackageRepo) FindByID(ctx context.Context, id string) (*models.Package, error) {
	var pkg models.Package
	if err := r.db.WithContext(ctx).First(&pkg, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &pkg, nil
}

func (r *gormPackageRepo) FindBySlug(ctx context.Context, slug string) (*models.Package, error) {
	var pkg models.Package
	if err := r.db.WithContext(ctx).First(&pkg, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &pkg, nil
}

func (r *gormPackageRepo) Create(ctx context.Context, pkg *models.Package) error {
	return r.db.WithContext(ctx).Create(pkg).Error
}

func (r *gormPackageRepo) Update(ctx context.Context, pkg *models.Package) error {
	return r.db.WithContext(ctx).Save(pkg).Error
}

func (r *gormPackageRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Package{}).Error
}

func (r *gormPackageRepo) IncrementView(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Model(&models.Package{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *gormPackageRepo) CountBySlug(ctx context.Context, slug string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Package{}).Where("slug = ?", slug).Count(&count).Error
	return count, err
}

func (r *gormPackageRepo) GetFilterOptions(ctx context.Context) (categories, destinations, currencies, availability []string, err error) {
	db := r.db.WithContext(ctx)
	var pkgs []models.Package
	if err = db.Select("categories_json, destination, currency, availability").
		Where("status = ?", "published").Find(&pkgs).Error; err != nil {
		return
	}
	catSet := map[string]struct{}{}
	destSet := map[string]struct{}{}
	currSet := map[string]struct{}{}
	availSet := map[string]struct{}{}
	for _, p := range pkgs {
		for _, c := range p.Categories {
			if c != "" {
				catSet[c] = struct{}{}
			}
		}
		if p.Destination != "" {
			destSet[p.Destination] = struct{}{}
		}
		if p.Currency != "" {
			currSet[p.Currency] = struct{}{}
		}
		if p.Availability != "" {
			availSet[p.Availability] = struct{}{}
		}
	}
	for k := range catSet {
		categories = append(categories, k)
	}
	for k := range destSet {
		destinations = append(destinations, k)
	}
	for k := range currSet {
		currencies = append(currencies, k)
	}
	for k := range availSet {
		availability = append(availability, k)
	}
	return
}

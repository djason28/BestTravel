package repository

import (
	"context"
	"sync"

	"besttravel/internal/models"

	"gorm.io/gorm"
)

type gormCarRepo struct{ db *gorm.DB }

// NewGormCarRepo creates a new GORM-backed CarRepository.
func NewGormCarRepo(db *gorm.DB) CarRepository { return &gormCarRepo{db: db} }

func (r *gormCarRepo) FindAll(ctx context.Context, q *gorm.DB, page, limit int) ([]models.Car, int64, error) {
	var total int64
	var items []models.Car

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

func (r *gormCarRepo) FindByID(ctx context.Context, id string) (*models.Car, error) {
	var car models.Car
	if err := r.db.WithContext(ctx).First(&car, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &car, nil
}

func (r *gormCarRepo) FindBySlug(ctx context.Context, slug string) (*models.Car, error) {
	var car models.Car
	if err := r.db.WithContext(ctx).First(&car, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &car, nil
}

func (r *gormCarRepo) Create(ctx context.Context, car *models.Car) error {
	return r.db.WithContext(ctx).Create(car).Error
}

func (r *gormCarRepo) Update(ctx context.Context, car *models.Car) error {
	return r.db.WithContext(ctx).Save(car).Error
}

func (r *gormCarRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.Car{}).Error
}

func (r *gormCarRepo) IncrementView(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Model(&models.Car{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *gormCarRepo) CountBySlug(ctx context.Context, slug string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Car{}).Where("slug = ?", slug).Count(&count).Error
	return count, err
}

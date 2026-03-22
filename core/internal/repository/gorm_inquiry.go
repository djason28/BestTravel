package repository

import (
	"context"
	"sync"

	"besttravel/internal/models"

	"gorm.io/gorm"
)

type gormInquiryRepo struct{ db *gorm.DB }

// NewGormInquiryRepo creates a new GORM-backed InquiryRepository.
func NewGormInquiryRepo(db *gorm.DB) InquiryRepository { return &gormInquiryRepo{db: db} }

func (r *gormInquiryRepo) FindAll(ctx context.Context, q *gorm.DB, page, limit int) ([]models.Inquiry, int64, error) {
	var total int64
	var items []models.Inquiry

	var wg sync.WaitGroup
	var countErr, listErr error
	wg.Add(2)
	go func() {
		defer wg.Done()
		countErr = q.WithContext(ctx).Count(&total).Error
	}()
	go func() {
		defer wg.Done()
		listErr = q.WithContext(ctx).Order("created_at DESC").Offset((page - 1) * limit).Limit(limit).Find(&items).Error
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

func (r *gormInquiryRepo) Create(ctx context.Context, inq *models.Inquiry) error {
	return r.db.WithContext(ctx).Create(inq).Error
}

func (r *gormInquiryRepo) UpdateStatus(ctx context.Context, id, status string) error {
	return r.db.WithContext(ctx).Model(&models.Inquiry{}).Where("id = ?", id).Update("status", status).Error
}

func (r *gormInquiryRepo) FindByID(ctx context.Context, id string) (*models.Inquiry, error) {
	var inq models.Inquiry
	if err := r.db.WithContext(ctx).First(&inq, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &inq, nil
}

func (r *gormInquiryRepo) IncrementPackageInquiryCount(ctx context.Context, packageID string) error {
	return r.db.WithContext(ctx).Model(&models.Package{}).Where("id = ?", packageID).
		UpdateColumn("inquiry_count", gorm.Expr("inquiry_count + 1")).Error
}

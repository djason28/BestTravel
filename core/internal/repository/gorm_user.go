package repository

import (
	"context"

	"besttravel/internal/models"

	"gorm.io/gorm"
)

type gormUserRepo struct{ db *gorm.DB }

// NewGormUserRepo creates a new GORM-backed UserRepository.
func NewGormUserRepo(db *gorm.DB) UserRepository { return &gormUserRepo{db: db} }

func (r *gormUserRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *gormUserRepo) FindByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *gormUserRepo) FindAll(ctx context.Context) ([]models.User, error) {
	var users []models.User
	if err := r.db.WithContext(ctx).Order("created_at desc").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *gormUserRepo) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *gormUserRepo) Save(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *gormUserRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.User{}).Error
}

func (r *gormUserRepo) CountByEmail(ctx context.Context, email string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.User{}).Where("email = ?", email).Count(&count).Error
	return count, err
}

func (r *gormUserRepo) FindByEmailExcluding(ctx context.Context, email, excludeID string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("email = ? AND id != ?", email, excludeID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

package controllers

import (
	"net/http"
	"strings"

	"besttravel/internal/config"
	"besttravel/internal/database"
	"besttravel/internal/models"
	"besttravel/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	cfg *config.Config
}

func NewAuthController(cfg *config.Config) *AuthController { return &AuthController{cfg: cfg} }

type loginReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

func (h *AuthController) Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "invalid request body")
		return
	}
	var user models.User
	if err := database.Ctx(c).Where("email = ?", strings.ToLower(req.Email)).First(&user).Error; err != nil {
		fail(c, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		fail(c, http.StatusUnauthorized, "invalid credentials")
		return
	}
	token, _, err := utils.GenerateJWT(h.cfg, user.ID, user.Email, user.Role)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to generate token")
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"token":   token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
	})
}

func (h *AuthController) Refresh(c *gin.Context) {
	auth := c.GetHeader("Authorization")
	if !strings.HasPrefix(auth, "Bearer ") {
		fail(c, http.StatusUnauthorized, "missing token")
		return
	}
	tokenStr := strings.TrimPrefix(auth, "Bearer ")
	claims, err := utils.ParseJWT(h.cfg, tokenStr)
	if err != nil {
		fail(c, http.StatusUnauthorized, "invalid token")
		return
	}
	newToken, _, err := utils.GenerateJWT(h.cfg, claims.UserID, claims.Email, claims.Role)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to refresh token")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "token": newToken})
}

func (h *AuthController) Logout(c *gin.Context) {
	auth := c.GetHeader("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		claims, err := utils.ParseJWT(h.cfg, tokenStr)
		if err == nil {
			// Add to blacklist
			_ = database.DB.Create(&models.TokenBlacklist{
				Token:     tokenStr,
				ExpiresAt: claims.ExpiresAt.Time,
			}).Error
		}
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *AuthController) Me(c *gin.Context) {
	uid, _ := c.Get("userId")
	var user models.User
	if err := database.Ctx(c).First(&user, "id = ?", uid).Error; err != nil {
		fail(c, http.StatusNotFound, "user not found")
		return
	}
	ok(c, gin.H{"id": user.ID, "email": user.Email, "name": user.Name, "role": user.Role})
}

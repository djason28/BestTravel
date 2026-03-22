package controllers

import (
	"net/http"
	"strings"

	"besttravel/internal/config"
	"besttravel/internal/repository"
	"besttravel/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	cfg      *config.Config
	userRepo repository.UserRepository
	authRepo repository.AuthRepository
}

func NewAuthController(cfg *config.Config, userRepo repository.UserRepository, authRepo repository.AuthRepository) *AuthController {
	return &AuthController{cfg: cfg, userRepo: userRepo, authRepo: authRepo}
}

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
	user, err := h.userRepo.FindByEmail(c.Request.Context(), strings.ToLower(req.Email))
	if err != nil {
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
	// Check blacklist by jti before issuing a new token
	if claims.ID != "" {
		if h.authRepo.IsTokenBlacklisted(c.Request.Context(), claims.ID) {
			fail(c, http.StatusUnauthorized, "token revoked")
			return
		}
	}
	newToken, _, err := utils.GenerateJWT(h.cfg, claims.UserID, claims.Email, claims.Role)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to refresh token")
		return
	}
	// Revoke the old token to prevent replay attacks
	if claims.ID != "" {
		_ = h.authRepo.BlacklistToken(c.Request.Context(), claims.ID, claims.ExpiresAt.Time)
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "token": newToken})
}

func (h *AuthController) Logout(c *gin.Context) {
	auth := c.GetHeader("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		claims, err := utils.ParseJWT(h.cfg, tokenStr)
		if err == nil && claims.ID != "" {
			// Store jti in blacklist (small UUID, not full token string)
			_ = h.authRepo.BlacklistToken(c.Request.Context(), claims.ID, claims.ExpiresAt.Time)
		}
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *AuthController) Me(c *gin.Context) {
	uid, _ := c.Get("userId")
	user, err := h.userRepo.FindByID(c.Request.Context(), uid.(string))
	if err != nil {
		fail(c, http.StatusNotFound, "user not found")
		return
	}
	ok(c, gin.H{"id": user.ID, "email": user.Email, "name": user.Name, "role": user.Role})
}

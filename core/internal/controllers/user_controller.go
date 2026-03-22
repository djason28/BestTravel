package controllers

import (
	"net/http"
	"strings"

	"besttravel/internal/models"
	"besttravel/internal/repository"
	"besttravel/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserController struct {
	repo repository.UserRepository
}

func NewUserController(repo repository.UserRepository) *UserController {
	return &UserController{repo: repo}
}

type userResp struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	CreatedAt string `json:"createdAt"`
}

func toUserResp(u models.User) userResp {
	return userResp{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		Role:      u.Role,
		CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// GET /api/users — list all admin users
func (h *UserController) GetAll(c *gin.Context) {
	users, err := h.repo.FindAll(c.Request.Context())
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to fetch users")
		return
	}
	resp := make([]userResp, len(users))
	for i, u := range users {
		resp[i] = toUserResp(u)
	}
	ok(c, resp)
}

// POST /api/users — create a new admin user
type createUserReq struct {
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role"`
}

func (h *UserController) Create(c *gin.Context) {
	var req createUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	existing, _ := h.repo.FindByEmail(c.Request.Context(), strings.ToLower(req.Email))
	if existing != nil {
		fail(c, http.StatusConflict, "email already exists")
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to hash password")
		return
	}

	role := req.Role
	if role == "" {
		role = "admin"
	}
	if role != "admin" && role != "editor" {
		fail(c, http.StatusBadRequest, "invalid role: must be 'admin' or 'editor'")
		return
	}

	user := models.User{
		ID:           uuid.NewString(),
		Email:        strings.ToLower(req.Email),
		Name:         req.Name,
		PasswordHash: hash,
		Role:         role,
	}

	if err := h.repo.Create(c.Request.Context(), &user); err != nil {
		fail(c, http.StatusInternalServerError, "failed to create user")
		return
	}
	created(c, toUserResp(user))
}

// DELETE /api/users/:id — remove an admin user
func (h *UserController) Delete(c *gin.Context) {
	id := c.Param("id")
	callerID := c.GetString("userId")
	if callerID == id {
		fail(c, http.StatusBadRequest, "cannot delete your own account")
		return
	}
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		fail(c, http.StatusInternalServerError, "failed to delete user")
		return
	}
	ok(c, nil)
}

// PUT /api/auth/profile — update own name / email
type updateProfileReq struct {
	Name  string `json:"name" binding:"required"`
	Email string `json:"email" binding:"required,email"`
}

func (h *UserController) UpdateProfile(c *gin.Context) {
	userID := c.GetString("userId")
	var req updateProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.repo.FindByID(c.Request.Context(), userID)
	if err != nil {
		fail(c, http.StatusNotFound, "user not found")
		return
	}

	newEmail := strings.ToLower(req.Email)
	if newEmail != user.Email {
		dup, _ := h.repo.FindByEmailExcluding(c.Request.Context(), newEmail, userID)
		if dup != nil {
			fail(c, http.StatusConflict, "email already in use")
			return
		}
	}

	user.Name = req.Name
	user.Email = newEmail
	if err := h.repo.Save(c.Request.Context(), user); err != nil {
		fail(c, http.StatusInternalServerError, "failed to update profile")
		return
	}
	ok(c, toUserResp(*user))
}

// PUT /api/auth/password — change own password
type changePasswordReq struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}

func (h *UserController) ChangePassword(c *gin.Context) {
	userID := c.GetString("userId")
	var req changePasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.repo.FindByID(c.Request.Context(), userID)
	if err != nil {
		fail(c, http.StatusNotFound, "user not found")
		return
	}

	if !utils.CheckPassword(user.PasswordHash, req.CurrentPassword) {
		fail(c, http.StatusUnauthorized, "current password is incorrect")
		return
	}

	hash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to hash password")
		return
	}

	user.PasswordHash = hash
	if err := h.repo.Save(c.Request.Context(), user); err != nil {
		fail(c, http.StatusInternalServerError, "failed to update password")
		return
	}
	ok(c, gin.H{"message": "password updated successfully"})
}

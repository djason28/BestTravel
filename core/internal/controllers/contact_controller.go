package controllers

import (
	"net/http"

	"besttravel/internal/config"
	"besttravel/internal/database"
	"besttravel/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ContactController struct{ cfg *config.Config }

func NewContactController(cfg *config.Config) *ContactController { return &ContactController{cfg: cfg} }

type contactReq struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email" binding:"required,email"`
	Phone   string `json:"phone" binding:"required"`
	Subject string `json:"subject" binding:"required"`
	Message string `json:"message" binding:"required"`
}

func (h *ContactController) Send(c *gin.Context) {
	var req contactReq
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "invalid request body")
		return
	}
	// Field length caps — prevent large-payload DoS
	if len(req.Name) > 120 || len(req.Email) > 254 || len(req.Phone) > 30 ||
		len(req.Subject) > 200 || len(req.Message) > 4000 {
		fail(c, http.StatusBadRequest, "one or more fields exceed allowed length")
		return
	}

	// Save contact inquiry to database
	inquiry := models.Inquiry{
		ID:      uuid.NewString(),
		Name:    req.Name,
		Email:   req.Email,
		Phone:   req.Phone,
		Subject: req.Subject,
		Message: req.Message,
		Status:  "new",
		Source:  "contact", // Mark as coming from contact form
	}

	if err := database.DB.Create(&inquiry).Error; err != nil {
		fail(c, http.StatusInternalServerError, "failed to save inquiry")
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Message sent successfully"})
}

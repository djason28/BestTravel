package middleware

import (
	"net/http"
	"strings"

	"besttravel/internal/config"
	"besttravel/internal/utils"

	"github.com/gin-gonic/gin"
)

type ContextKeys string

const (
	CtxUserID   ContextKeys = "userId"
	CtxUserRole ContextKeys = "role"
)

func AuthRequired(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "error": "missing token"})
			return
		}
		token := strings.TrimPrefix(auth, "Bearer ")
		claims, err := utils.ParseJWT(cfg, token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "error": "invalid token"})
			return
		}
		c.Set(string(CtxUserID), claims.UserID)
		c.Set(string(CtxUserRole), claims.Role)
		c.Next()
	}
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get(string(CtxUserRole))
		if role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "error": "forbidden"})
			return
		}
		c.Next()
	}
}

// OptionalAuth extracts user context if token present, but doesn't abort if missing
func OptionalAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if strings.HasPrefix(auth, "Bearer ") {
			token := strings.TrimPrefix(auth, "Bearer ")
			claims, err := utils.ParseJWT(cfg, token)
			if err == nil {
				c.Set(string(CtxUserID), claims.UserID)
				c.Set(string(CtxUserRole), claims.Role)
			}
		}
		c.Next()
	}
}

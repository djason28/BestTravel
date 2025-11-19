package controllers

import "github.com/gin-gonic/gin"

func ok(c *gin.Context, data interface{}) {
	c.JSON(200, gin.H{"success": true, "data": data})
}

func created(c *gin.Context, data interface{}) {
	c.JSON(201, gin.H{"success": true, "data": data})
}

func fail(c *gin.Context, code int, msg string) {
	c.JSON(code, gin.H{"success": false, "error": msg})
}

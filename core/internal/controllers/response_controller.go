package controllers

import "github.com/gin-gonic/gin"

// Standard success response.
func ok(c *gin.Context, data interface{}) {
	c.JSON(200, gin.H{"success": true, "data": data})
}

// Standard created response.
func created(c *gin.Context, data interface{}) {
	c.JSON(201, gin.H{"success": true, "data": data})
}

// Unified error response. 'code' is HTTP status, 'errCode' is internal stable code.
func fail(c *gin.Context, code int, msg string) {
	c.JSON(code, gin.H{"success": false, "error": msg, "code": httpStatusToCode(code)})
}

// httpStatusToCode maps HTTP status to simple internal string codes for now.
func httpStatusToCode(status int) string {
	switch status {
	case 400:
		return "BAD_REQUEST"
	case 401:
		return "UNAUTHORIZED"
	case 403:
		return "FORBIDDEN"
	case 404:
		return "NOT_FOUND"
	case 409:
		return "CONFLICT"
	case 422:
		return "UNPROCESSABLE"
	case 500:
		return "INTERNAL_ERROR"
	default:
		return "ERROR"
	}
}

package utils

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// QueryInt returns the int value of a query param and a boolean indicating presence and valid parse.
func QueryInt(c *gin.Context, key string) (int, bool) {
	v := c.Query(key)
	if v == "" {
		return 0, false
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		return 0, false
	}
	return i, true
}

// QueryInt64 returns the int64 value of a query param and a boolean indicating presence and valid parse.
func QueryInt64(c *gin.Context, key string) (int64, bool) {
	v := c.Query(key)
	if v == "" {
		return 0, false
	}
	i, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return 0, false
	}
	return i, true
}

// QueryBool parses typical boolean query values (true/false, 1/0, yes/no, on/off).
func QueryBool(c *gin.Context, key string) (bool, bool) {
	v := strings.ToLower(strings.TrimSpace(c.Query(key)))
	if v == "" {
		return false, false
	}
	switch v {
	case "1", "true", "yes", "on":
		return true, true
	case "0", "false", "no", "off":
		return false, true
	default:
		return false, false
	}
}

// QueryStringSlice splits a comma-separated query value into a slice of trimmed strings.
func QueryStringSlice(c *gin.Context, key string) []string {
	v := c.Query(key)
	if v == "" {
		return nil
	}
	parts := strings.Split(v, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

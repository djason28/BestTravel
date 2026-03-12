package middleware

import (
	"github.com/gin-contrib/secure"
	"github.com/gin-gonic/gin"
)

func SecureHeaders() gin.HandlerFunc {
	return secure.New(secure.Config{
		FrameDeny:             true,
		ContentTypeNosniff:    true,
		BrowserXssFilter:      true,
		SSLRedirect:           false,
		STSSeconds:            31536000,
		STSIncludeSubdomains:  true,
		ReferrerPolicy:        "strict-origin-when-cross-origin",
		FeaturePolicy:         "geolocation 'none'; microphone 'none'; camera 'none'",
		ContentSecurityPolicy: "default-src 'self' blob:; script-src 'self'; img-src 'self' data: blob: https:;",
	})
}

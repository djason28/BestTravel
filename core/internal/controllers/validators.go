package controllers

import (
	"errors"
	"fmt"

	"github.com/go-playground/validator/v10"
)

// FormatValidationError converts validator errors into a simple map
func FormatValidationError(err error) map[string]string {
	errs := make(map[string]string)
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		for _, fe := range ve {
			field := fe.Field()
			switch fe.Tag() {
			case "required":
				errs[field] = fmt.Sprintf("%s is required", field)
			case "min":
				errs[field] = fmt.Sprintf("%s must be at least %s characters", field, fe.Param())
			case "gte":
				errs[field] = fmt.Sprintf("%s must be greater than or equal to %s", field, fe.Param())
			case "email":
				errs[field] = "Invalid email format"
			default:
				errs[field] = fmt.Sprintf("Invalid value for %s", field)
			}
		}
	} else {
		errs["error"] = err.Error()
	}
	return errs
}

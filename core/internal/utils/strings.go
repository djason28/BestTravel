package utils

func Or(v, def string) string {
	if v == "" {
		return def
	}
	return v
}

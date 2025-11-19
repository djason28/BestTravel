package utils

import (
	"net/http"
	"os"
)

// NoListFS wraps an http.FileSystem and disables directory listing by
// returning os.ErrNotExist when a directory is requested.
type NoListFS struct {
	FS http.FileSystem
}

func (n NoListFS) Open(name string) (http.File, error) {
	f, err := n.FS.Open(name)
	if err != nil {
		return nil, err
	}
	fi, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if fi.IsDir() {
		// Prevent directory listing
		return nil, os.ErrNotExist
	}
	return f, nil
}

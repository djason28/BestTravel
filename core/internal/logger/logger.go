package logger

import (
	"log/slog"
	"os"
	"sync"
)

var (
	Log  *slog.Logger
	once sync.Once
)

// Init initializes the global logger.
// If env is "production", it uses JSON format. Otherwise, it uses text format.
func Init(env string) {
	once.Do(func() {
		var handler slog.Handler
		opts := &slog.HandlerOptions{
			Level: slog.LevelInfo,
		}

		if env == "production" {
			handler = slog.NewJSONHandler(os.Stdout, opts)
		} else {
			handler = slog.NewTextHandler(os.Stdout, opts)
		}

		Log = slog.New(handler)
		slog.SetDefault(Log)
	})
}

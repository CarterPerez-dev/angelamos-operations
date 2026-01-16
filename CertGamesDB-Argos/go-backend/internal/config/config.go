/*
AngelaMos | 2025
config.go
*/

package config

import (
	"fmt"
	"sync"
	"time"

	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

type Config struct {
	App    AppConfig    `koanf:"app"`
	Server ServerConfig `koanf:"server"`
	Mongo  MongoConfig  `koanf:"mongodb"`
	SQLite SQLiteConfig `koanf:"sqlite"`
	Backup BackupConfig `koanf:"backup"`
	CORS   CORSConfig   `koanf:"cors"`
	Log    LogConfig    `koanf:"log"`
}

type AppConfig struct {
	Name        string `koanf:"name"`
	Version     string `koanf:"version"`
	Environment string `koanf:"environment"`
}

type ServerConfig struct {
	Host            string        `koanf:"host"`
	Port            int           `koanf:"port"`
	ReadTimeout     time.Duration `koanf:"read_timeout"`
	WriteTimeout    time.Duration `koanf:"write_timeout"`
	IdleTimeout     time.Duration `koanf:"idle_timeout"`
	ShutdownTimeout time.Duration `koanf:"shutdown_timeout"`
}

type MongoConfig struct {
	URI            string        `koanf:"uri"`
	Database       string        `koanf:"database"`
	MaxPoolSize    uint64        `koanf:"max_pool_size"`
	MinPoolSize    uint64        `koanf:"min_pool_size"`
	ConnectTimeout time.Duration `koanf:"connect_timeout"`
}

type SQLiteConfig struct {
	Path string `koanf:"path"`
}

type BackupConfig struct {
	OutputDir        string `koanf:"output_dir"`
	MongodumpPath    string `koanf:"mongodump_path"`
	MongorestorePath string `koanf:"mongorestore_path"`
	RetentionDays    int    `koanf:"retention_days"`
}

type CORSConfig struct {
	AllowedOrigins   []string `koanf:"allowed_origins"`
	AllowedMethods   []string `koanf:"allowed_methods"`
	AllowedHeaders   []string `koanf:"allowed_headers"`
	AllowCredentials bool     `koanf:"allow_credentials"`
	MaxAge           int      `koanf:"max_age"`
}

type LogConfig struct {
	Level  string `koanf:"level"`
	Format string `koanf:"format"`
}

var (
	cfg  *Config
	once sync.Once
)

func Load(configPath string) (*Config, error) {
	var loadErr error

	once.Do(func() {
		k := koanf.New(".")

		if err := loadDefaults(k); err != nil {
			loadErr = fmt.Errorf("load defaults: %w", err)
			return
		}

		if configPath != "" {
			if err := k.Load(file.Provider(configPath), yaml.Parser()); err != nil {
				loadErr = fmt.Errorf("load config file: %w", err)
				return
			}
		}

		if err := k.Load(env.Provider("", ".", envKeyReplacer), nil); err != nil {
			loadErr = fmt.Errorf("load env vars: %w", err)
			return
		}

		cfg = &Config{}
		if err := k.Unmarshal("", cfg); err != nil {
			loadErr = fmt.Errorf("unmarshal config: %w", err)
			return
		}

		if err := validate(cfg); err != nil {
			loadErr = fmt.Errorf("validate config: %w", err)
			return
		}
	})

	if loadErr != nil {
		return nil, loadErr
	}

	return cfg, nil
}

func Get() *Config {
	if cfg == nil {
		panic("config not loaded: call Load() first")
	}
	return cfg
}

func loadDefaults(k *koanf.Koanf) error {
	defaults := map[string]any{
		"app.name":        "MongoDB Dashboard",
		"app.version":     "1.0.0",
		"app.environment": "development",

		"server.host":             "0.0.0.0",
		"server.port":             8080,
		"server.read_timeout":     "30s",
		"server.write_timeout":    "30s",
		"server.idle_timeout":     "120s",
		"server.shutdown_timeout": "15s",

		"mongodb.uri":             "mongodb://localhost:27017",
		"mongodb.database":        "admin",
		"mongodb.max_pool_size":   100,
		"mongodb.min_pool_size":   10,
		"mongodb.connect_timeout": "10s",

		"sqlite.path": "./data/dashboard.db",

		"backup.output_dir":        "./backups",
		"backup.mongodump_path":    "mongodump",
		"backup.mongorestore_path": "mongorestore",
		"backup.retention_days":    30,

		"cors.allowed_origins": []string{"http://localhost:5173"},
		"cors.allowed_methods": []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},
		"cors.allowed_headers": []string{
			"Accept",
			"Content-Type",
			"X-Request-ID",
		},
		"cors.allow_credentials": true,
		"cors.max_age":           300,

		"log.level":  "info",
		"log.format": "json",
	}

	for key, value := range defaults {
		if err := k.Set(key, value); err != nil {
			return fmt.Errorf("set default %s: %w", key, err)
		}
	}

	return nil
}

var envKeyMap = map[string]string{
	"MONGODB_URI":            "mongodb.uri",
	"MONGODB_DATABASE":       "mongodb.database",
	"MONGODB_MAX_POOL_SIZE":  "mongodb.max_pool_size",
	"MONGODB_MIN_POOL_SIZE":  "mongodb.min_pool_size",
	"MONGODB_CONNECT_TIMEOUT": "mongodb.connect_timeout",
	"SQLITE_PATH":            "sqlite.path",
	"BACKUP_OUTPUT_DIR":      "backup.output_dir",
	"BACKUP_MONGODUMP_PATH":  "backup.mongodump_path",
	"BACKUP_RETENTION_DAYS":  "backup.retention_days",
	"ENVIRONMENT":            "app.environment",
	"HOST":                   "server.host",
	"PORT":                   "server.port",
	"LOG_LEVEL":              "log.level",
	"LOG_FORMAT":             "log.format",
}

func envKeyReplacer(s string) string {
	if mapped, ok := envKeyMap[s]; ok {
		return mapped
	}
	return ""
}

func validate(c *Config) error {
	if c.Mongo.URI == "" {
		return fmt.Errorf("MONGODB_URI is required")
	}

	if c.CORS.AllowCredentials {
		for _, origin := range c.CORS.AllowedOrigins {
			if origin == "*" {
				return fmt.Errorf(
					"CORS wildcard '*' cannot be used with AllowCredentials",
				)
			}
		}
	}

	if c.Server.ReadTimeout <= 0 {
		return fmt.Errorf("server.read_timeout must be positive")
	}

	if c.Server.WriteTimeout <= 0 {
		return fmt.Errorf("server.write_timeout must be positive")
	}

	return nil
}

func (c *Config) IsProduction() bool {
	return c.App.Environment == "production"
}

func (c *Config) IsDevelopment() bool {
	return c.App.Environment == "development"
}

func (s *ServerConfig) Address() string {
	return fmt.Sprintf("%s:%d", s.Host, s.Port)
}

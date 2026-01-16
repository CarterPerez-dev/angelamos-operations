/*
AngelaMos | 2026
config.go
*/

package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

type Config struct {
	Server     ServerConfig     `koanf:"server"`
	Scanner    ScannerConfig    `koanf:"scanner"`
	Protection ProtectionConfig `koanf:"protection"`
	Docker     DockerConfig     `koanf:"docker"`
	Logging    LoggingConfig    `koanf:"logging"`
	DataDir    string           `koanf:"data_dir"`
}

type ServerConfig struct {
	Host           string   `koanf:"host"`
	Port           int      `koanf:"port"`
	AllowedOrigins []string `koanf:"allowed_origins"`
}

type ScannerConfig struct {
	Paths        []string      `koanf:"paths"`
	Exclude      []string      `koanf:"exclude"`
	ScanInterval time.Duration `koanf:"scan_interval"`
}

type ProtectionConfig struct {
	Patterns []string `koanf:"patterns"`
	Projects []string `koanf:"projects"`
}

type DockerConfig struct {
	Socket string `koanf:"socket"`
}

type LoggingConfig struct {
	Level  string `koanf:"level"`
	Format string `koanf:"format"`
}

// Load reads configuration from file and environment variables.
// Priority: env vars > config file > defaults
func Load(configPath string) (*Config, error) {
	k := koanf.New(".")

	cfg := defaultConfig()

	if configPath == "" {
		configPath = findConfigFile()
	}

	if configPath != "" {
		if err := k.Load(file.Provider(configPath), yaml.Parser()); err != nil {
			return nil, fmt.Errorf("loading config file: %w", err)
		}
	}

	envProvider := env.Provider("HOLOPHYLY_", ".", func(s string) string {
		return strings.ReplaceAll(
			strings.ToLower(strings.TrimPrefix(s, "HOLOPHYLY_")),
			"_", ".",
		)
	})

	if err := k.Load(envProvider, nil); err != nil {
		return nil, fmt.Errorf("loading env vars: %w", err)
	}

	if err := k.Unmarshal("", cfg); err != nil {
		return nil, fmt.Errorf("unmarshaling config: %w", err)
	}

	if paths := os.Getenv("HOLOPHYLY_SCANNER_PATHS"); paths != "" {
		cfg.Scanner.Paths = strings.Split(paths, ",")
	}

	cfg.expandPaths()

	return cfg, nil
}

func defaultConfig() *Config {
	home, _ := os.UserHomeDir()

	return &Config{
		Server: ServerConfig{
			Host: "127.0.0.1",
			Port: 9001,
			AllowedOrigins: []string{
				"http://localhost:*",
				"http://127.0.0.1:*",
			},
		},
		Scanner: ScannerConfig{
			Paths: []string{
				filepath.Join(home, "projects"),
				filepath.Join(home, "dev"),
			},
			Exclude: []string{
				"node_modules",
				".git",
				"vendor",
				"__pycache__",
				".venv",
				"venv",
			},
			ScanInterval: 30 * time.Second,
		},
		Protection: ProtectionConfig{
			Patterns: []string{
				"*cloudflare*",
				"*tunnel*",
			},
			Projects: []string{},
		},
		Docker: DockerConfig{
			Socket: "unix:///var/run/docker.sock",
		},
		Logging: LoggingConfig{
			Level:  "info",
			Format: "json",
		},
	}
}

func findConfigFile() string {
	locations := []string{
		"holophyly.yaml",
		"holophyly.yml",
		"config.yaml",
		"config.yml",
	}

	home, err := os.UserHomeDir()
	if err == nil {
		configDir := filepath.Join(home, ".config", "holophyly")
		locations = append(locations,
			filepath.Join(configDir, "config.yaml"),
			filepath.Join(configDir, "config.yml"),
		)
	}

	for _, loc := range locations {
		if _, err := os.Stat(loc); err == nil {
			return loc
		}
	}

	return ""
}

func (c *Config) expandPaths() {
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}

	for i, path := range c.Scanner.Paths {
		if strings.HasPrefix(path, "~/") {
			c.Scanner.Paths[i] = filepath.Join(home, path[2:])
		}
	}

	for i, path := range c.Protection.Projects {
		if strings.HasPrefix(path, "~/") {
			c.Protection.Projects[i] = filepath.Join(home, path[2:])
		}
	}
}

// Address returns the full server address.
func (c *Config) Address() string {
	return fmt.Sprintf("%s:%d", c.Server.Host, c.Server.Port)
}

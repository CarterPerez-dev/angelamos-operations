/*
AngelaMos | 2026
patterns.go
*/

package scanner

import (
	"path/filepath"
	"strings"

	"github.com/carterperez-dev/holophyly/internal/model"
)

var developmentPatterns = []string{
	"dev",
	"development",
	"local",
	"test",
	"testing",
	"staging",
	"stage",
	"debug",
}

var productionPatterns = []string{
	"prod",
	"production",
	"live",
	"release",
	"main",
	"master",
}

// detectEnvironment determines if a compose file is for dev or prod
// based on filename patterns.
func detectEnvironment(composePath string) model.Environment {
	filename := strings.ToLower(filepath.Base(composePath))
	filenameWithoutExt := strings.TrimSuffix(filename, filepath.Ext(filename))

	dir := strings.ToLower(filepath.Base(filepath.Dir(composePath)))

	for _, pattern := range productionPatterns {
		if containsPattern(filenameWithoutExt, pattern) {
			return model.EnvProduction
		}
	}

	for _, pattern := range developmentPatterns {
		if containsPattern(filenameWithoutExt, pattern) {
			return model.EnvDevelopment
		}
	}

	for _, pattern := range productionPatterns {
		if containsPattern(dir, pattern) {
			return model.EnvProduction
		}
	}

	return model.EnvDevelopment
}

func containsPattern(s, pattern string) bool {
	if strings.Contains(s, pattern) {
		return true
	}

	parts := splitByDelimiters(s)
	for _, part := range parts {
		if part == pattern {
			return true
		}
	}

	return false
}

func splitByDelimiters(s string) []string {
	result := make([]string, 0)
	current := strings.Builder{}

	for _, r := range s {
		if r == '-' || r == '_' || r == '.' {
			if current.Len() > 0 {
				result = append(result, current.String())
				current.Reset()
			}
		} else {
			current.WriteRune(r)
		}
	}

	if current.Len() > 0 {
		result = append(result, current.String())
	}

	return result
}

// IsProtectedByPattern checks if a container/project name matches
// protection patterns (cloudflare tunnels, etc).
func IsProtectedByPattern(name string) (bool, model.ProtectionReason) {
	lower := strings.ToLower(name)

	cloudflarePatterns := []string{
		"cloudflare",
		"cloudflared",
		"cf-tunnel",
		"cftunnel",
		"tunnel",
		"argo",
	}

	for _, pattern := range cloudflarePatterns {
		if strings.Contains(lower, pattern) {
			return true, model.ProtectionCloudflareTunnel
		}
	}

	criticalPatterns := []string{
		"traefik",
		"nginx-proxy",
		"reverse-proxy",
		"gateway",
		"ingress",
	}

	for _, pattern := range criticalPatterns {
		if strings.Contains(lower, pattern) {
			return true, model.ProtectionAutoDetected
		}
	}

	return false, ""
}

// ClassifyComposeFile provides metadata about a compose file based on its name.
func ClassifyComposeFile(filename string) ComposeFileInfo {
	lower := strings.ToLower(filename)
	withoutExt := strings.TrimSuffix(lower, filepath.Ext(lower))

	info := ComposeFileInfo{
		Filename:    filename,
		Environment: detectEnvironmentFromName(withoutExt),
		IsOverride:  strings.Contains(lower, "override"),
		IsBase:      isBaseComposeFile(lower),
	}

	return info
}

type ComposeFileInfo struct {
	Filename    string
	Environment model.Environment
	IsOverride  bool
	IsBase      bool
}

func detectEnvironmentFromName(name string) model.Environment {
	for _, pattern := range productionPatterns {
		if containsPattern(name, pattern) {
			return model.EnvProduction
		}
	}

	for _, pattern := range developmentPatterns {
		if containsPattern(name, pattern) {
			return model.EnvDevelopment
		}
	}

	return model.EnvUnknown
}

func isBaseComposeFile(filename string) bool {
	baseNames := []string{
		"compose.yml",
		"compose.yaml",
		"docker-compose.yml",
		"docker-compose.yaml",
	}

	for _, base := range baseNames {
		if filename == base {
			return true
		}
	}

	return false
}

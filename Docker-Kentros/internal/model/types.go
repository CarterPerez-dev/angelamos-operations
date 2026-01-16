/*
AngelaMos | 2026
types.go
*/

package model

import (
	"time"
)

type Environment string

const (
	EnvDevelopment Environment = "development"
	EnvProduction  Environment = "production"
	EnvUnknown     Environment = "unknown"
)

type ProjectStatus string

const (
	StatusRunning ProjectStatus = "running"
	StatusStopped ProjectStatus = "stopped"
	StatusPartial ProjectStatus = "partial"
	StatusUnknown ProjectStatus = "unknown"
)

type ProtectionReason string

const (
	ProtectionCloudflareTunnel ProtectionReason = "cloudflare_tunnel"
	ProtectionUserMarked       ProtectionReason = "user_marked"
	ProtectionAutoDetected     ProtectionReason = "auto_detected"
)

type Project struct {
	ID               string           `json:"id"`
	Name             string           `json:"name"`
	DisplayName      string           `json:"display_name,omitempty"`
	Path             string           `json:"path"`
	ComposeFile      string           `json:"compose_file"`
	ComposeFilePath  string           `json:"compose_file_path"`
	Environment      Environment      `json:"environment"`
	Status           ProjectStatus    `json:"status"`
	Protected        bool             `json:"protected"`
	ProtectionReason ProtectionReason `json:"protection_reason,omitempty"`
	Hidden           bool             `json:"hidden"`
	Containers       []Container      `json:"containers"`
	Services         []string         `json:"services"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

type Container struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	ServiceName string            `json:"service_name"`
	Image       string            `json:"image"`
	Status      string            `json:"status"`
	State       string            `json:"state"`
	Health      string            `json:"health,omitempty"`
	Ports       []PortMapping     `json:"ports"`
	Labels      map[string]string `json:"labels"`
	Stats       *ContainerStats   `json:"stats,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	StartedAt   time.Time         `json:"started_at,omitempty"`
}

type PortMapping struct {
	HostIP        string `json:"host_ip,omitempty"`
	HostPort      uint16 `json:"host_port"`
	ContainerPort uint16 `json:"container_port"`
	Protocol      string `json:"protocol"`
}

type ContainerStats struct {
	CPUPercent    float64   `json:"cpu_percent"`
	MemoryUsage   uint64    `json:"memory_usage"`
	MemoryLimit   uint64    `json:"memory_limit"`
	MemoryPercent float64   `json:"memory_percent"`
	NetworkRx     uint64    `json:"network_rx"`
	NetworkTx     uint64    `json:"network_tx"`
	BlockRead     uint64    `json:"block_read"`
	BlockWrite    uint64    `json:"block_write"`
	PIDs          uint64    `json:"pids"`
	Timestamp     time.Time `json:"timestamp"`
}

type SystemInfo struct {
	DockerVersion     string `json:"docker_version"`
	APIVersion        string `json:"api_version"`
	OS                string `json:"os"`
	Arch              string `json:"arch"`
	Containers        int    `json:"containers"`
	ContainersRunning int    `json:"containers_running"`
	ContainersPaused  int    `json:"containers_paused"`
	ContainersStopped int    `json:"containers_stopped"`
	Images            int    `json:"images"`
}

type StorageInfo struct {
	ImagesSize     uint64         `json:"images_size"`
	ContainersSize uint64         `json:"containers_size"`
	VolumesSize    uint64         `json:"volumes_size"`
	BuildCacheSize uint64         `json:"build_cache_size"`
	TotalSize      uint64         `json:"total_size"`
	Reclaimable    uint64         `json:"reclaimable"`
	Details        StorageDetails `json:"details"`
}

type StorageDetails struct {
	Images     []ImageInfo  `json:"images"`
	Volumes    []VolumeInfo `json:"volumes"`
	BuildCache []CacheInfo  `json:"build_cache"`
}

type ImageInfo struct {
	ID         string    `json:"id"`
	Repository string    `json:"repository"`
	Tag        string    `json:"tag"`
	Size       uint64    `json:"size"`
	Created    time.Time `json:"created"`
	InUse      bool      `json:"in_use"`
}

type VolumeInfo struct {
	Name      string    `json:"name"`
	Driver    string    `json:"driver"`
	Size      uint64    `json:"size"`
	InUse     bool      `json:"in_use"`
	CreatedAt time.Time `json:"created_at"`
}

type CacheInfo struct {
	ID         string    `json:"id"`
	Type       string    `json:"type"`
	Size       uint64    `json:"size"`
	InUse      bool      `json:"in_use"`
	CreatedAt  time.Time `json:"created_at"`
	LastUsedAt time.Time `json:"last_used_at"`
}

type PortCheck struct {
	Port      uint16 `json:"port"`
	Available bool   `json:"available"`
	Process   string `json:"process,omitempty"`
	PID       int    `json:"pid,omitempty"`
}

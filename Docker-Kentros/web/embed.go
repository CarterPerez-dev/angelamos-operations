/*
AngelaMos | 2026
embed.go
*/

package web

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed index.html static/*
var content embed.FS

// FS returns the embedded filesystem for the web UI.
func FS() http.FileSystem {
	sub, err := fs.Sub(content, ".")
	if err != nil {
		panic(err)
	}
	return http.FS(sub)
}

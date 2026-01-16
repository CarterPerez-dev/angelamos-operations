/*
AngelaMos | 2026
store.go
*/

package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
	mu sync.RWMutex
}

type ProjectPreference struct {
	ProjectID   string
	DisplayName string
	Hidden      bool
}

func New(dataDir string) (*Store, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("creating data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "holophyly.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}

	store := &Store{db: db}

	if err := store.migrate(); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrating database: %w", err)
	}

	return store, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate() error {
	schema := `
		CREATE TABLE IF NOT EXISTS project_preferences (
			project_id TEXT PRIMARY KEY,
			display_name TEXT,
			hidden INTEGER DEFAULT 0
		);
	`

	_, err := s.db.Exec(schema)
	return err
}

func (s *Store) GetPreference(projectID string) (*ProjectPreference, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var pref ProjectPreference
	var displayName sql.NullString
	var hidden int

	err := s.db.QueryRow(
		"SELECT project_id, display_name, hidden FROM project_preferences WHERE project_id = ?",
		projectID,
	).Scan(&pref.ProjectID, &displayName, &hidden)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	pref.DisplayName = displayName.String
	pref.Hidden = hidden == 1

	return &pref, nil
}

func (s *Store) GetAllPreferences() (map[string]*ProjectPreference, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	rows, err := s.db.Query("SELECT project_id, display_name, hidden FROM project_preferences")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	prefs := make(map[string]*ProjectPreference)
	for rows.Next() {
		var pref ProjectPreference
		var displayName sql.NullString
		var hidden int

		if err := rows.Scan(&pref.ProjectID, &displayName, &hidden); err != nil {
			return nil, err
		}

		pref.DisplayName = displayName.String
		pref.Hidden = hidden == 1
		prefs[pref.ProjectID] = &pref
	}

	return prefs, rows.Err()
}

func (s *Store) SetDisplayName(projectID, displayName string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var nullName sql.NullString
	if displayName != "" {
		nullName = sql.NullString{String: displayName, Valid: true}
	}

	_, err := s.db.Exec(`
		INSERT INTO project_preferences (project_id, display_name, hidden)
		VALUES (?, ?, 0)
		ON CONFLICT(project_id) DO UPDATE SET display_name = excluded.display_name
	`, projectID, nullName)

	return err
}

func (s *Store) SetHidden(projectID string, hidden bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	hiddenInt := 0
	if hidden {
		hiddenInt = 1
	}

	_, err := s.db.Exec(`
		INSERT INTO project_preferences (project_id, display_name, hidden)
		VALUES (?, NULL, ?)
		ON CONFLICT(project_id) DO UPDATE SET hidden = excluded.hidden
	`, projectID, hiddenInt)

	return err
}

func (s *Store) DeletePreference(projectID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, err := s.db.Exec("DELETE FROM project_preferences WHERE project_id = ?", projectID)
	return err
}

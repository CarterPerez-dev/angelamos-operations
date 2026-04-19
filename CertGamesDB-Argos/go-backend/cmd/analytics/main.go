// ©AngelaMos | 2026
// main.go

package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/joho/godotenv"

	"github.com/carterperez-dev/templates/go-backend/internal/analytics"
	"github.com/carterperez-dev/templates/go-backend/internal/config"
	"github.com/carterperez-dev/templates/go-backend/internal/mongodb"
)

func main() {
	userFlag := flag.String("user", "", "user email or username (required)")
	outputFlag := flag.String("output", ".", "output directory for analysis files")
	configFlag := flag.String("config", "config.yaml", "path to config file")
	categoryFlag := flag.String("category", "secplus", "test category")
	flag.Parse()

	if *userFlag == "" {
		fmt.Fprintln(os.Stderr, "error: --user is required")
		flag.Usage()
		os.Exit(1)
	}

	if err := run(*userFlag, *outputFlag, *configFlag, *categoryFlag); err != nil {
		slog.Error("fatal", "error", err)
		os.Exit(1)
	}
}

func run(user, output, configPath, category string) error {
	_ = godotenv.Load()

	cfg, err := config.Load(configPath)
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn})))

	ctx := context.Background()

	mongoCfg := cfg.Mongo
	if !strings.Contains(mongoCfg.URI, "directConnection") {
		sep := "?"
		if strings.Contains(mongoCfg.URI, "?") {
			sep = "&"
		}
		mongoCfg.URI += sep + "directConnection=true"
	}

	client, err := mongodb.NewClient(ctx, mongoCfg)
	if err != nil {
		return fmt.Errorf("connect to mongodb: %w", err)
	}
	defer client.Close(ctx)

	repo := analytics.NewRepository(client, cfg.Mongo.Database)

	u, err := repo.FindUser(ctx, user)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}
	fmt.Printf("User: %s (%s)\n", u.Username, u.Email)

	attempts, err := repo.FindFinishedAttempts(ctx, u.ID, category)
	if err != nil {
		return fmt.Errorf("find attempts: %w", err)
	}

	if len(attempts) == 0 {
		fmt.Println("No finished attempts found.")
		return nil
	}

	seen := make(map[int]bool)
	var testIDs []int
	for _, a := range attempts {
		if !seen[a.TestID] {
			seen[a.TestID] = true
			testIDs = append(testIDs, a.TestID)
		}
	}

	tests, err := repo.FindTestsByIDs(ctx, testIDs, category)
	if err != nil {
		return fmt.Errorf("find tests: %w", err)
	}

	ua := analytics.ComputeAnalytics(*u, attempts, tests)

	fmt.Printf("Found %d attempt(s) across %d test(s)\n\n", len(ua.Attempts), len(testIDs))

	for _, attempt := range ua.Attempts {
		commentary := analytics.GenerateCommentary(attempt, ua.Attempts)
		content := analytics.Render(*u, attempt, commentary, ua.Attempts, category)

		if err := analytics.WriteFile(output, category, attempt.FileLabel, content); err != nil {
			return fmt.Errorf("write %s: %w", attempt.FileLabel, err)
		}

		filename := fmt.Sprintf("%s-%s-analysis.md", category, attempt.FileLabel)
		fmt.Printf("  wrote %s (%s -- %d/%d, %s)\n",
			filename, attempt.Label, attempt.Score, attempt.Total, attempt.Date.Format("Jan 2"))
	}

	fmt.Printf("\nFiles written to: %s\n", output)
	return nil
}

// ©AngelaMos | 2026
// renderer.go

package analytics

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

var categoryDisplayNames = map[string]string{
	"secplus": "Security+",
}

var trapMeanings = map[string]string{
	"partial knowledge":             "Knows part of the concept but not the full picture",
	"reversal":                      "Two concepts get flipped — e.g. confusing authentication vs authorization",
	"correct-in-different-scenario": "Answer would be right in another context",
	"overgeneralization":            "Answer applies a rule too broadly",
	"adjacent concept":              "Picks the neighbor instead of the answer",
	"plausible but unrelated":       "Answer sounds security-relevant but doesn't address what was actually asked",
}

func Render(user User, current AttemptAnalytics, commentary AttemptCommentary, allAttempts []AttemptAnalytics, category string) string {
	var b strings.Builder
	idx := current.AttemptIndex
	previous := allAttempts[:idx]

	catName := categoryDisplayNames[category]
	if catName == "" {
		catName = category
	}

	renderHeader(&b, user, current, commentary, previous, catName)
	renderDimSection(&b, "Domain Performance", "Domain", current.DomainScores, previous, domainScoresOf, commentary.DomainCommentary, "")
	renderDimSection(&b, "Question Type Breakdown", "Type", current.QuestionTypeScores, previous, qtypeScoresOf, commentary.QuestionTypeCommentary, "**Takeaway:** ")
	renderTrapSection(&b, current, previous, commentary, idx)
	renderDimSection(&b, "Question Length", "Length", current.StemLengthScores, previous, lengthScoresOf, commentary.StemLengthCommentary, "")
	renderTagWeaknesses(&b, current, commentary)
	renderMidRange(&b, commentary)
	renderStrong(&b, commentary)
	renderTrajectorySection(&b, commentary, allAttempts[:idx+1])
	renderSummarySection(&b, commentary)

	return b.String()
}

func WriteFile(dir, category, fileLabel, content string) error {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create output directory: %w", err)
	}
	filename := fmt.Sprintf("%s-%s-analysis.md", category, fileLabel)
	path := filepath.Join(dir, filename)
	return os.WriteFile(path, []byte(content), 0o644)
}

func domainScoresOf(a AttemptAnalytics) []DimensionScore  { return a.DomainScores }
func qtypeScoresOf(a AttemptAnalytics) []DimensionScore   { return a.QuestionTypeScores }
func trapScoresOf(a AttemptAnalytics) []DimensionScore    { return a.TrapTypeScores }
func lengthScoresOf(a AttemptAnalytics) []DimensionScore  { return a.StemLengthScores }

func renderHeader(b *strings.Builder, user User, current AttemptAnalytics, commentary AttemptCommentary, previous []AttemptAnalytics, catName string) {
	fmt.Fprintf(b, "# %s — %s Practice %s Analysis\n\n", user.Username, catName, current.Label)
	fmt.Fprintf(b, "**Date taken:** %s\n", current.Date.Format("January 2, 2006"))

	if current.IsRetake {
		base := baseTestLabel(current.Label)
		retakeSuffix := "Retake"
		if current.RetakeNumber > 1 {
			retakeSuffix = fmt.Sprintf("Retake %d", current.RetakeNumber)
		}
		fmt.Fprintf(b, "**Test:** %s Practice %s (CertGames) — %s\n", catName, base, retakeSuffix)
	} else {
		fmt.Fprintf(b, "**Test:** %s Practice %s (CertGames)\n", catName, current.Label)
	}

	fmt.Fprintf(b, "**Overall score:** %d/%d\n", current.Score, current.Total)

	if current.IsRetake {
		for i := len(previous) - 1; i >= 0; i-- {
			if previous[i].TestID == current.TestID {
				fmt.Fprintf(b, "**Previous score (same test):** %d/%d on %s\n",
					previous[i].Score, previous[i].Total, previous[i].Date.Format("January 2"))
				break
			}
		}
	}

	if commentary.TrajectoryLine != "" {
		fmt.Fprintf(b, "\n> **%s**\n", commentary.TrajectoryLine)
	}

	b.WriteString("\n---\n\n")
}

func renderDimSection(b *strings.Builder, title, col string, scores []DimensionScore, previous []AttemptAnalytics, getter func(AttemptAnalytics) []DimensionScore, text, prefix string) {
	fmt.Fprintf(b, "## %s\n\n", title)
	renderDimTable(b, col, scores, previous, getter)

	if text != "" {
		b.WriteString("\n")
		if prefix != "" {
			b.WriteString(prefix)
		}
		b.WriteString(text)
		b.WriteString("\n")
	}

	b.WriteString("\n---\n\n")
}

func renderDimTable(b *strings.Builder, col string, scores []DimensionScore, previous []AttemptAnalytics, getter func(AttemptAnalytics) []DimensionScore) {
	np := len(previous)

	if np == 0 {
		fmt.Fprintf(b, "| %s | Score | %% |\n", col)
		b.WriteString("|---|---|---|\n")
		for _, s := range scores {
			fmt.Fprintf(b, "| %s | %d/%d | **%d%%** |\n",
				capitalize(s.Label), s.Correct, s.Total, s.PctInt())
		}
		return
	}

	if np == 1 {
		prev := getter(previous[0])
		fmt.Fprintf(b, "| %s | Score | %% | %s | Change |\n", col, previous[0].Label)
		b.WriteString("|---|---|---|---|---|\n")
		for _, s := range scores {
			pStr, cStr := "—", ""
			if p, ok := findByLabel(prev, s.Label); ok {
				pStr = fmt.Sprintf("%d%%", p.PctInt())
				cStr = fmtDelta(s.PctInt() - p.PctInt())
			}
			fmt.Fprintf(b, "| %s | %d/%d | **%d%%** | %s | %s |\n",
				capitalize(s.Label), s.Correct, s.Total, s.PctInt(), pStr, cStr)
		}
		return
	}

	hdr := make([]string, 0, 3+np+1)
	hdr = append(hdr, col, "Score", "%")
	for _, p := range previous {
		hdr = append(hdr, p.Label)
	}
	hdr = append(hdr, "Trend")

	b.WriteString("| " + strings.Join(hdr, " | ") + " |\n")
	b.WriteString("|" + strings.Repeat("---|", len(hdr)) + "\n")

	for _, s := range scores {
		row := make([]string, 0, len(hdr))
		row = append(row, capitalize(s.Label), fmt.Sprintf("%d/%d", s.Correct, s.Total), fmt.Sprintf("**%d%%**", s.PctInt()))

		var pcts []int
		for _, p := range previous {
			if ps, ok := findByLabel(getter(p), s.Label); ok {
				row = append(row, fmt.Sprintf("%d%%", ps.PctInt()))
				pcts = append(pcts, ps.PctInt())
			} else {
				row = append(row, "—")
			}
		}
		pcts = append(pcts, s.PctInt())
		row = append(row, computeTrend(pcts))

		b.WriteString("| " + strings.Join(row, " | ") + " |\n")
	}
}

func renderTrapSection(b *strings.Builder, current AttemptAnalytics, previous []AttemptAnalytics, c AttemptCommentary, idx int) {
	b.WriteString("## Trap Type Breakdown\n\n")

	if idx == 0 {
		b.WriteString("This tracks *why* wrong answers are chosen, not just *that* they were wrong.\n\n")
		b.WriteString("| Trap | Score | % | What it means |\n")
		b.WriteString("|---|---|---|---|\n")
		for _, s := range current.TrapTypeScores {
			fmt.Fprintf(b, "| %s | %d/%d | **%d%%** | %s |\n",
				capitalize(s.Label), s.Correct, s.Total, s.PctInt(), trapMeanings[s.Label])
		}
	} else {
		renderDimTable(b, "Trap", current.TrapTypeScores, previous, trapScoresOf)
	}

	if c.TrapTypeCommentary != "" {
		b.WriteString("\n**Takeaway:** ")
		b.WriteString(c.TrapTypeCommentary)
		b.WriteString("\n")
	}

	b.WriteString("\n---\n\n")
}

func renderTagWeaknesses(b *strings.Builder, current AttemptAnalytics, c AttemptCommentary) {
	b.WriteString("## Tag-Level Weaknesses\n\n")
	b.WriteString("Topics with 0% (missed every question):\n\n")

	tagTotals := make(map[string]int)
	for _, t := range current.TagScores {
		tagTotals[t.Tag] = t.Total
	}

	if len(c.TagGroups) == 0 {
		b.WriteString("No tags at 0%.\n\n")
	} else {
		for _, g := range c.TagGroups {
			fmt.Fprintf(b, "**%s:**\n", g.Theme)
			for _, tag := range g.Tags {
				if n := tagTotals[tag]; n > 1 {
					fmt.Fprintf(b, "- %s (0/%d)\n", tag, n)
				} else {
					fmt.Fprintf(b, "- %s\n", tag)
				}
			}
			b.WriteString("\n")
		}
	}

	var weak []TagScore
	for _, t := range current.TagScores {
		if t.Correct > 0 && t.Total > 1 && t.Pct() < 50 {
			weak = append(weak, t)
		}
	}
	sort.Slice(weak, func(i, j int) bool { return weak[i].Pct() < weak[j].Pct() })

	if len(weak) > 0 {
		b.WriteString("Other weak spots:\n\n")
		for _, t := range weak {
			fmt.Fprintf(b, "- %s — %d%% (%d/%d)\n", t.Tag, t.PctInt(), t.Correct, t.Total)
		}
		b.WriteString("\n")
	}

	b.WriteString("---\n\n")
}

func renderMidRange(b *strings.Builder, c AttemptCommentary) {
	if len(c.MidRangeTags) == 0 {
		return
	}

	b.WriteString("## Mid-Range Tags (50-99%, multi-question)\n\n")
	b.WriteString("| Tag | Score | % |\n")
	b.WriteString("|---|---|---|\n")
	for _, t := range c.MidRangeTags {
		fmt.Fprintf(b, "| %s | %d/%d | %d%% |\n", t.Tag, t.Correct, t.Total, t.PctInt())
	}

	b.WriteString("\n---\n\n")
}

func renderStrong(b *strings.Builder, c AttemptCommentary) {
	if len(c.StrongTags) == 0 {
		return
	}

	b.WriteString("## Strong Areas (100% on these tags)\n\n")

	var multi, single []string
	for _, tag := range c.StrongTags {
		if isMultiQuestionTag(tag) {
			multi = append(multi, tag)
		} else {
			single = append(single, tag)
		}
	}

	if len(multi) > 0 {
		b.WriteString(strings.Join(multi, ", "))
		b.WriteString("\n")
	}

	if len(single) > 0 {
		if len(multi) > 0 {
			b.WriteString("\n")
		}
		fmt.Fprintf(b, "Also 100%% on %d single-question tags.\n", len(single))
	}

	if len(c.NotableImprovements) > 0 {
		b.WriteString("\n**Notable improvements from previous 0% tags:**\n")
		limit := len(c.NotableImprovements)
		if limit > 10 {
			limit = 10
		}
		for _, imp := range c.NotableImprovements[:limit] {
			fmt.Fprintf(b, "- %s\n", imp)
		}
		if len(c.NotableImprovements) > 10 {
			fmt.Fprintf(b, "- ...and %d more\n", len(c.NotableImprovements)-10)
		}
	}

	b.WriteString("\n---\n\n")
}

func isMultiQuestionTag(tag string) bool {
	last := strings.LastIndex(tag, " (")
	if last == -1 {
		return false
	}
	suffix := tag[last:]
	return strings.Contains(suffix, "/") && strings.HasSuffix(suffix, ")")
}

func renderTrajectorySection(b *strings.Builder, c AttemptCommentary, attempts []AttemptAnalytics) {
	if len(c.TrajectoryRows) == 0 {
		return
	}

	labels := make([]string, len(attempts))
	for i, a := range attempts {
		labels[i] = a.Label
	}

	if len(attempts) == 2 {
		fmt.Fprintf(b, "## %s → %s Progress Summary\n\n", labels[0], labels[1])
	} else {
		fmt.Fprintf(b, "## Full Trajectory: %s\n\n", strings.Join(labels, " → "))
	}

	hdr := []string{"Metric"}
	for _, a := range attempts {
		hdr = append(hdr, fmt.Sprintf("%s (%s)", a.Label, a.Date.Format("Jan 2")))
	}
	b.WriteString("| " + strings.Join(hdr, " | ") + " |\n")
	b.WriteString("|" + strings.Repeat("---|", len(hdr)) + "\n")

	for _, row := range c.TrajectoryRows {
		cells := []string{fmt.Sprintf("**%s**", row.Metric)}
		last := len(row.Values) - 1
		for i, val := range row.Values {
			if i == last {
				cells = append(cells, fmt.Sprintf("**%s**", val))
			} else {
				cells = append(cells, val)
			}
		}
		b.WriteString("| " + strings.Join(cells, " | ") + " |\n")
	}

	b.WriteString("\n---\n\n")
}

func renderSummarySection(b *strings.Builder, c AttemptCommentary) {
	b.WriteString("## Summary\n\n")

	s := c.Summary

	if len(s.LockedIn) > 0 {
		b.WriteString("**What's locked in:**\n")
		for _, item := range s.LockedIn {
			fmt.Fprintf(b, "- %s\n", item)
		}
		b.WriteString("\n")
	}

	if len(s.NeedsWork) > 0 {
		b.WriteString("**What still needs work:**\n\n")
		for i, item := range s.NeedsWork {
			fmt.Fprintf(b, "%d. %s\n", i+1, item)
		}
		b.WriteString("\n")
	}

	if len(s.FocusAreas) > 0 {
		b.WriteString("**Focus areas:**\n\n")
		for i, area := range s.FocusAreas {
			fmt.Fprintf(b, "%d. %s\n", i+1, area)
		}
		b.WriteString("\n")
	}

	if s.Blockquote != "" {
		fmt.Fprintf(b, "> *%s*\n", s.Blockquote)
	}
}

func computeTrend(values []int) string {
	n := len(values)
	if n < 2 {
		return "—"
	}

	curr := values[n-1]
	prev := values[n-2]
	delta := curr - prev

	if curr >= 100 {
		return "Perfect"
	}

	monotonic := true
	for i := 1; i < n; i++ {
		if values[i] < values[i-1] {
			monotonic = false
			break
		}
	}

	totalGain := curr - values[0]

	switch {
	case delta > 20:
		return "Breakout"
	case monotonic && totalGain > 25:
		return "Strong climb"
	case monotonic && delta > 5:
		return "Climbing"
	case monotonic && delta > 0:
		return "Steady climb"
	case delta == 0:
		return "Flat"
	case delta > -5 && delta < 5:
		return "Stable"
	case delta <= -10:
		return "Dropped"
	case delta < 0:
		return "Slight dip"
	default:
		if totalGain > 10 {
			return "Still climbing"
		}
		return "Slight gain"
	}
}

func capitalize(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

func fmtDelta(d int) string {
	if d > 0 {
		return fmt.Sprintf("+%d", d)
	}
	return fmt.Sprintf("%d", d)
}

func baseTestLabel(label string) string {
	if i := strings.Index(label, " (Retake"); i != -1 {
		return label[:i]
	}
	return label
}

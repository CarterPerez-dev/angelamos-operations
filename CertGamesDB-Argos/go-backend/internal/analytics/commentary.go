// ©AngelaMos | 2026
// commentary.go

package analytics

import (
	"fmt"
	"math"
	"strings"
)

func GenerateCommentary(current AttemptAnalytics, all []AttemptAnalytics) AttemptCommentary {
	idx := current.AttemptIndex
	var previous []AttemptAnalytics
	if idx > 0 && idx < len(all) {
		previous = all[:idx]
	}

	buckets := BucketTags(current.TagScores)
	midRange := MultiQuestionMidRange(buckets.Mid)
	tagGroups := GroupZeroPercentTags(current.TagScores)

	var strongTags []string
	for _, t := range buckets.Perfect {
		if t.Total > 1 {
			strongTags = append(strongTags, fmt.Sprintf("%s (%d/%d)", t.Tag, t.Correct, t.Total))
		} else {
			strongTags = append(strongTags, t.Tag)
		}
	}

	notable := findNotableImprovements(current, previous)

	trajectoryRows := buildTrajectoryRows(all[:idx+1])

	return AttemptCommentary{
		TrajectoryLine:         trajectoryLine(all, idx),
		DomainCommentary:       domainCommentary(current, previous),
		QuestionTypeCommentary: questionTypeCommentary(current, previous),
		TrapTypeCommentary:     trapTypeCommentary(current, previous),
		StemLengthCommentary:   stemLengthCommentary(current, previous),
		TagGroups:              tagGroups,
		MidRangeTags:           midRange,
		StrongTags:             strongTags,
		NotableImprovements:    notable,
		TrajectoryRows:         trajectoryRows,
		Summary:                generateSummary(current, previous, tagGroups, strongTags, buckets),
	}
}

func trajectoryLine(all []AttemptAnalytics, idx int) string {
	if idx == 0 {
		return ""
	}

	if idx == 1 {
		prev := all[0]
		curr := all[1]
		delta := curr.Score - prev.Score
		if delta > 0 {
			return fmt.Sprintf("+%d points from %s (%d → %d).", delta, prev.Label, prev.Score, curr.Score)
		}
		if delta < 0 {
			return fmt.Sprintf("%d points from %s (%d → %d).", delta, prev.Label, prev.Score, curr.Score)
		}
		return fmt.Sprintf("Same score as %s (%d).", prev.Label, curr.Score)
	}

	var scores []string
	for i := 0; i <= idx; i++ {
		scores = append(scores, fmt.Sprintf("%d", all[i].Score))
	}
	trajectory := strings.Join(scores, " → ")

	monotonic := true
	for i := 1; i <= idx; i++ {
		if all[i].Score < all[i-1].Score {
			monotonic = false
			break
		}
	}

	if monotonic {
		return fmt.Sprintf("Trajectory: %s. Consistent upward trend across %d tests.", trajectory, idx+1)
	}
	return fmt.Sprintf("Trajectory: %s.", trajectory)
}

func domainCommentary(current AttemptAnalytics, previous []AttemptAnalytics) string {
	var findings []string

	weakest := findWeakest(current.DomainScores)
	strongest := findStrongest(current.DomainScores)

	var strongDomains []string
	for _, d := range current.DomainScores {
		if d.PctInt() >= 80 {
			strongDomains = append(strongDomains, fmt.Sprintf("%s at %d%%", d.Label, d.PctInt()))
		}
	}
	if len(strongDomains) > 0 {
		findings = append(findings, strings.Join(strongDomains, " and ")+" — performing well.")
	}

	if len(previous) > 0 {
		prev := previous[len(previous)-1]
		biggestJump := findBiggestJump(current.DomainScores, prev.DomainScores)
		if biggestJump.delta > 20 {
			findings = append(findings, fmt.Sprintf("%s had the biggest jump (+%d points).", biggestJump.label, biggestJump.delta))
		}

		for _, d := range current.DomainScores {
			prevD, ok := findByLabel(prev.DomainScores, d.Label)
			if !ok {
				continue
			}
			drop := prevD.PctInt() - d.PctInt()
			if drop > 10 {
				findings = append(findings, fmt.Sprintf("%s dipped from %d%% back to %d%%.", d.Label, prevD.PctInt(), d.PctInt()))
			}
		}

		if len(previous) >= 2 {
			prevPrev := previous[len(previous)-2]
			for _, d := range current.DomainScores {
				pp, ok1 := findByLabel(prevPrev.DomainScores, d.Label)
				p, ok2 := findByLabel(prev.DomainScores, d.Label)
				if !ok1 || !ok2 {
					continue
				}
				if abs(d.PctInt()-p.PctInt()) <= 3 && abs(p.PctInt()-pp.PctInt()) <= 3 {
					findings = append(findings, fmt.Sprintf("%s stuck at %d%% — hasn't moved in the last two tests.", d.Label, d.PctInt()))
				}
			}
		}
	}

	pct := weakest.PctInt()
	switch {
	case pct < 40:
		findings = append(findings, fmt.Sprintf("%s at %d%% is critically weak and should be the first priority.", weakest.Label, pct))
	case pct < 50:
		findings = append(findings, fmt.Sprintf("%s is the weakest domain at %d%% and should be a priority.", weakest.Label, pct))
	case pct < 60:
		findings = append(findings, fmt.Sprintf("%s is the weakest domain at %d%% — needs more work.", weakest.Label, pct))
	default:
		findings = append(findings, fmt.Sprintf("%s is the weakest domain at %d%%, but no domain is critically low.", weakest.Label, pct))
	}

	_ = strongest

	return strings.Join(findings, "\n\n")
}

func questionTypeCommentary(current AttemptAnalytics, previous []AttemptAnalytics) string {
	var findings []string

	weakest := findWeakest(current.QuestionTypeScores)
	strongest := findStrongest(current.QuestionTypeScores)

	if strongest.PctInt() >= 80 {
		label := strings.Title(strongest.Label)
		findings = append(findings, fmt.Sprintf("%s questions are the strongest at %d%%.", label, strongest.PctInt()))
	}

	if len(previous) > 0 {
		prev := previous[len(previous)-1]
		for _, qt := range current.QuestionTypeScores {
			prevQt, ok := findByLabel(prev.QuestionTypeScores, qt.Label)
			if !ok {
				continue
			}
			delta := qt.PctInt() - prevQt.PctInt()
			if delta > 20 {
				label := strings.Title(qt.Label)
				findings = append(findings, fmt.Sprintf("%s questions jumped from %d%% to %d%% (+%d).", label, prevQt.PctInt(), qt.PctInt(), delta))
			}
		}

		prevGap := findStrongest(prev.QuestionTypeScores).PctInt() - findWeakest(prev.QuestionTypeScores).PctInt()
		currGap := strongest.PctInt() - weakest.PctInt()
		if prevGap > 0 && currGap < prevGap-5 {
			findings = append(findings, fmt.Sprintf("The gap between best and worst question types narrowed from %d points to %d points. Performance is becoming more consistent.", prevGap, currGap))
		}
	}

	wPct := weakest.PctInt()
	wLabel := strings.Title(weakest.Label)
	switch {
	case weakest.Label == "analysis" && wPct < 40:
		findings = append(findings, fmt.Sprintf("Analysis questions — complex scenarios requiring diagnosis and best-response selection — are the biggest gap at %d%%. This is the type the real exam loads up on.", wPct))
	case weakest.Label == "evaluation":
		findings = append(findings, fmt.Sprintf("%s questions at %d%% — \"pick the *best* answer among several correct-sounding ones\" — remain the hardest question type.", wLabel, wPct))
	default:
		if wPct < 50 {
			findings = append(findings, fmt.Sprintf("%s questions are the weakest type at %d%%.", wLabel, wPct))
		}
	}

	return strings.Join(findings, "\n\n")
}

func trapTypeCommentary(current AttemptAnalytics, previous []AttemptAnalytics) string {
	var findings []string

	weakest := findWeakest(current.TrapTypeScores)
	wPct := weakest.PctInt()

	if len(previous) > 0 {
		prev := previous[len(previous)-1]
		for _, tr := range current.TrapTypeScores {
			prevTr, ok := findByLabel(prev.TrapTypeScores, tr.Label)
			if !ok {
				continue
			}
			delta := tr.PctInt() - prevTr.PctInt()
			if delta > 40 {
				findings = append(findings, fmt.Sprintf("`%s` trap: %d%% → %d%% (+%d) — a complete turnaround.", tr.Label, prevTr.PctInt(), tr.PctInt(), delta))
			} else if delta > 20 {
				findings = append(findings, fmt.Sprintf("`%s` trap improved significantly: %d%% → %d%% (+%d).", tr.Label, prevTr.PctInt(), tr.PctInt(), delta))
			}
		}

		for _, tr := range current.TrapTypeScores {
			if tr.PctInt() >= 90 {
				findings = append(findings, fmt.Sprintf("`%s` at %d%% — nearly immune to this trap type.", tr.Label, tr.PctInt()))
			}
		}
	}

	switch {
	case wPct < 30:
		findings = append(findings, fmt.Sprintf("`%s` is the most dangerous pattern at %d%%.", weakest.Label, wPct))
	case weakest.Label == "partial knowledge":
		findings = append(findings, fmt.Sprintf("`%s` at %d%% — surface-level knowledge is there but the details aren't locked in.", weakest.Label, wPct))
	case weakest.Label == "adjacent concept":
		findings = append(findings, fmt.Sprintf("`%s` at %d%% — picking the answer that sounds right and is closely related, but isn't the best fit for the specific scenario.", weakest.Label, wPct))
	case weakest.Label == "reversal":
		findings = append(findings, fmt.Sprintf("`%s` at %d%% — concept-pair confusion (e.g., authentication vs authorization, IDS vs IPS) is still catching them.", weakest.Label, wPct))
	case weakest.Label == "plausible but unrelated":
		findings = append(findings, fmt.Sprintf("`%s` at %d%% — wrong answers tend to be security-relevant terms that don't address the actual question.", weakest.Label, wPct))
	default:
		findings = append(findings, fmt.Sprintf("`%s` is the weakest trap at %d%%.", weakest.Label, wPct))
	}

	return strings.Join(findings, "\n\n")
}

func stemLengthCommentary(current AttemptAnalytics, previous []AttemptAnalytics) string {
	var findings []string

	short, hasShort := findByLabel(current.StemLengthScores, "short")
	long, hasLong := findByLabel(current.StemLengthScores, "long")

	if hasShort && short.Total < 5 {
		findings = append(findings, fmt.Sprintf("Only %d short questions on this test, so that number isn't very meaningful.", short.Total))
	}

	if hasShort && hasLong {
		if long.PctInt() > short.PctInt() && len(previous) > 0 {
			prev := previous[len(previous)-1]
			prevLong, ok := findByLabel(prev.StemLengthScores, "long")
			if ok && prevLong.PctInt() < short.PctInt() {
				findings = append(findings, fmt.Sprintf("Long questions are now the strongest length category at %d%%. This is a complete reversal from previous tests.", long.PctInt()))
			}
		}

		if hasLong && long.PctInt() < 50 {
			findings = append(findings, "Long questions below 50% suggest a concentration or fatigue factor with multi-sentence scenarios.")
		}

		gap := short.PctInt() - long.PctInt()
		if gap > 15 {
			findings = append(findings, fmt.Sprintf("Clear downward trend as questions get longer — %d-point gap between short (%d%%) and long (%d%%).", gap, short.PctInt(), long.PctInt()))
		}
	}

	if len(previous) > 0 && hasLong {
		prev := previous[len(previous)-1]
		prevLong, ok := findByLabel(prev.StemLengthScores, "long")
		if ok {
			delta := long.PctInt() - prevLong.PctInt()
			if delta > 15 {
				findings = append(findings, fmt.Sprintf("Long question performance improved significantly: %d%% → %d%% (+%d).", prevLong.PctInt(), long.PctInt(), delta))
			}
		}
	}

	if len(findings) == 0 {
		findings = append(findings, "Question length performance is relatively even across short, medium, and long questions.")
	}

	return strings.Join(findings, "\n\n")
}

func findNotableImprovements(current AttemptAnalytics, previous []AttemptAnalytics) []string {
	if len(previous) == 0 {
		return nil
	}

	currentTags := make(map[string]TagScore)
	for _, t := range current.TagScores {
		currentTags[t.Tag] = t
	}

	var improvements []string
	for _, prev := range previous {
		for _, pt := range prev.TagScores {
			if pt.Correct != 0 {
				continue
			}
			ct, ok := currentTags[pt.Tag]
			if !ok {
				continue
			}
			if ct.Correct == ct.Total && ct.Total > 0 {
				improvements = append(improvements, fmt.Sprintf("%s: 0%% (%s) → 100%%", pt.Tag, prev.Label))
			}
		}
	}

	seen := make(map[string]bool)
	var unique []string
	for _, imp := range improvements {
		tag := imp[:strings.Index(imp, ":")]
		if !seen[tag] {
			seen[tag] = true
			unique = append(unique, imp)
		}
	}

	return unique
}

func generateSummary(current AttemptAnalytics, previous []AttemptAnalytics, tagGroups []TagGroup, strongTags []string, buckets TagBuckets) SummaryBlock {
	var lockedIn []string
	var needsWork []string
	var focusAreas []string

	for _, d := range current.DomainScores {
		if d.PctInt() >= 80 {
			entry := fmt.Sprintf("**%s at %d%%**", d.Label, d.PctInt())
			if len(previous) > 0 {
				first := previous[0]
				firstD, ok := findByLabel(first.DomainScores, d.Label)
				if ok && firstD.PctInt() < 60 {
					entry += fmt.Sprintf(" — was %d%% on %s", firstD.PctInt(), first.Label)
				}
			}
			lockedIn = append(lockedIn, entry)
		}
	}

	for _, qt := range current.QuestionTypeScores {
		if qt.PctInt() >= 80 {
			label := strings.Title(qt.Label)
			entry := fmt.Sprintf("**%s questions at %d%%**", label, qt.PctInt())
			if len(previous) > 0 {
				first := previous[0]
				firstQt, ok := findByLabel(first.QuestionTypeScores, qt.Label)
				if ok && firstQt.PctInt() < 50 {
					entry += fmt.Sprintf(" — was %d%% on %s", firstQt.PctInt(), first.Label)
				}
			}
			lockedIn = append(lockedIn, entry)
		}
	}

	for _, tr := range current.TrapTypeScores {
		if tr.PctInt() >= 80 {
			lockedIn = append(lockedIn, fmt.Sprintf("**%s trap at %d%%**", tr.Label, tr.PctInt()))
		}
	}

	weakDomain := findWeakest(current.DomainScores)
	if weakDomain.PctInt() < 70 {
		needsWork = append(needsWork, fmt.Sprintf("**%s (%d%%)**", weakDomain.Label, weakDomain.PctInt()))
	}

	weakType := findWeakest(current.QuestionTypeScores)
	if weakType.PctInt() < 70 {
		label := strings.Title(weakType.Label)
		needsWork = append(needsWork, fmt.Sprintf("**%s questions (%d%%)**", label, weakType.PctInt()))
	}

	weakTrap := findWeakest(current.TrapTypeScores)
	if weakTrap.PctInt() < 70 {
		needsWork = append(needsWork, fmt.Sprintf("**%s trap (%d%%)**", weakTrap.Label, weakTrap.PctInt()))
	}

	for _, g := range tagGroups {
		if len(g.Tags) >= 3 {
			focusAreas = append(focusAreas, fmt.Sprintf("**%s** — %d tags at 0%% in this domain", g.Theme, len(g.Tags)))
		}
	}

	if weakType.PctInt() < 60 {
		label := strings.Title(weakType.Label)
		focusAreas = append(focusAreas, fmt.Sprintf("**%s question practice** — scenario-based drills, not just flashcards", label))
	}

	totalTests := len(previous) + 1
	retakeCount := 0
	uniqueTests := make(map[int]bool)
	for _, a := range append(previous, current) {
		uniqueTests[a.TestID] = true
		if a.IsRetake {
			retakeCount++
		}
	}

	var bqParts []string
	if retakeCount > 0 {
		bqParts = append(bqParts, fmt.Sprintf("Based on %d completed attempts (%s, %s).",
			totalTests, plural(len(uniqueTests), "test"), plural(retakeCount, "retake")))
	} else {
		bqParts = append(bqParts, fmt.Sprintf("Based on %s.", plural(totalTests, "completed test")))
	}

	if totalTests > 1 {
		first := previous[0].Score
		last := current.Score
		if last > first {
			bqParts = append(bqParts, "Trajectory is strongly positive.")
		} else if last == first {
			bqParts = append(bqParts, "Score has held steady.")
		} else {
			bqParts = append(bqParts, "Score has declined — review study approach.")
		}
	}

	if weakDomain.PctInt() < 70 || weakType.PctInt() < 70 {
		var bottlenecks []string
		if weakDomain.PctInt() < 70 {
			bottlenecks = append(bottlenecks, weakDomain.Label)
		}
		if weakType.PctInt() < 70 {
			bottlenecks = append(bottlenecks, strings.Title(weakType.Label)+" questions")
		}
		if len(bottlenecks) == 1 {
			bqParts = append(bqParts, bottlenecks[0]+" is the clearest remaining bottleneck.")
		} else {
			bqParts = append(bqParts, strings.Join(bottlenecks, " and ")+" are the clearest remaining bottlenecks.")
		}
	}

	return SummaryBlock{
		LockedIn:   lockedIn,
		NeedsWork:  needsWork,
		FocusAreas: focusAreas,
		Blockquote: strings.Join(bqParts, " "),
	}
}

func buildTrajectoryRows(attempts []AttemptAnalytics) []TrajectoryRow {
	if len(attempts) < 2 {
		return nil
	}

	rows := []TrajectoryRow{
		{Metric: "Overall"},
		{Metric: "Weakest domain"},
		{Metric: "Strongest domain"},
		{Metric: "Weakest question type"},
		{Metric: "Strongest question type"},
		{Metric: "Weakest trap"},
		{Metric: "Long question score"},
	}

	for _, a := range attempts {
		weakD := findWeakest(a.DomainScores)
		strongD := findStrongest(a.DomainScores)
		weakQT := findWeakest(a.QuestionTypeScores)
		strongQT := findStrongest(a.QuestionTypeScores)
		weakTrap := findWeakest(a.TrapTypeScores)
		longQ, hasLong := findByLabel(a.StemLengthScores, "long")

		longStr := "N/A"
		if hasLong {
			longStr = fmt.Sprintf("%d%%", longQ.PctInt())
		}

		values := []string{
			fmt.Sprintf("%d/%d", a.Score, a.Total),
			fmt.Sprintf("%s (%d%%)", shortDomain(weakD.Label), weakD.PctInt()),
			fmt.Sprintf("%s (%d%%)", shortDomain(strongD.Label), strongD.PctInt()),
			fmt.Sprintf("%s (%d%%)", strings.Title(weakQT.Label), weakQT.PctInt()),
			fmt.Sprintf("%s (%d%%)", strings.Title(strongQT.Label), strongQT.PctInt()),
			fmt.Sprintf("%s (%d%%)", weakTrap.Label, weakTrap.PctInt()),
			longStr,
		}

		for i := range rows {
			rows[i].Values = append(rows[i].Values, values[i])
		}
	}

	return rows
}

func shortDomain(label string) string {
	if i := strings.Index(label, " "); i > 0 {
		return "D" + strings.TrimRight(label[:i], ".0")
	}
	return label
}

func plural(n int, word string) string {
	if n == 1 {
		return fmt.Sprintf("%d %s", n, word)
	}
	return fmt.Sprintf("%d %ss", n, word)
}

func findWeakest(scores []DimensionScore) DimensionScore {
	if len(scores) == 0 {
		return DimensionScore{}
	}
	w := scores[0]
	for _, s := range scores[1:] {
		if s.Pct() < w.Pct() {
			w = s
		}
	}
	return w
}

func findStrongest(scores []DimensionScore) DimensionScore {
	if len(scores) == 0 {
		return DimensionScore{}
	}
	s := scores[0]
	for _, sc := range scores[1:] {
		if sc.Pct() > s.Pct() {
			s = sc
		}
	}
	return s
}

func findByLabel(scores []DimensionScore, label string) (DimensionScore, bool) {
	for _, s := range scores {
		if s.Label == label {
			return s, true
		}
	}
	return DimensionScore{}, false
}

type jumpResult struct {
	label string
	delta int
}

func findBiggestJump(current, previous []DimensionScore) jumpResult {
	var best jumpResult
	for _, c := range current {
		p, ok := findByLabel(previous, c.Label)
		if !ok {
			continue
		}
		d := c.PctInt() - p.PctInt()
		if d > best.delta {
			best = jumpResult{label: c.Label, delta: d}
		}
	}
	return best
}

func abs(x int) int {
	return int(math.Abs(float64(x)))
}

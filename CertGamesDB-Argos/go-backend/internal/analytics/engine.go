// ©AngelaMos | 2026
// engine.go

package analytics

import (
	"fmt"
	"log/slog"
	"sort"
	"strconv"
)

type counter struct {
	correct int
	total   int
}

type testTracker struct {
	sequenceNumber map[int]int
	seenCount      map[int]int
	nextSequence   int
}

func newTestTracker() *testTracker {
	return &testTracker{
		sequenceNumber: make(map[int]int),
		seenCount:      make(map[int]int),
		nextSequence:   1,
	}
}

func (t *testTracker) assign(testID int) (label, fileLabel string, isRetake bool, retakeNum int) {
	if _, seen := t.seenCount[testID]; !seen {
		t.sequenceNumber[testID] = t.nextSequence
		t.nextSequence++
		t.seenCount[testID] = 1
		n := t.sequenceNumber[testID]
		return fmt.Sprintf("Test %d", n), fmt.Sprintf("test%d", n), false, 0
	}

	t.seenCount[testID]++
	n := t.sequenceNumber[testID]
	count := t.seenCount[testID]
	if count == 2 {
		return fmt.Sprintf("Test %d (Retake)", n), fmt.Sprintf("test%d-retake", n), true, 1
	}
	return fmt.Sprintf("Test %d (Retake %d)", n, count-1), fmt.Sprintf("test%d-retake%d", n, count-1), true, count - 1
}

func ComputeAnalytics(user User, attempts []TestAttempt, tests map[int]*Test) *UserAnalytics {
	tracker := newTestTracker()
	ua := &UserAnalytics{User: user}

	for i, attempt := range attempts {
		test, ok := tests[attempt.TestID]
		if !ok {
			slog.Warn("test not found for attempt", "testId", attempt.TestID)
			continue
		}

		label, fileLabel, isRetake, retakeNum := tracker.assign(attempt.TestID)

		aa := computeAttempt(i, attempt, test, label, fileLabel, isRetake, retakeNum)
		ua.Attempts = append(ua.Attempts, aa)
	}

	return ua
}

func computeAttempt(idx int, attempt TestAttempt, test *Test, label, fileLabel string, isRetake bool, retakeNum int) AttemptAnalytics {
	qMap := make(map[int]TestQuestion, len(test.Questions))
	for _, q := range test.Questions {
		qMap[q.ID] = q
	}

	domains := make(map[string]*counter)
	qTypes := make(map[string]*counter)
	traps := make(map[string]*counter)
	lengths := make(map[string]*counter)
	tags := make(map[string]*counter)
	tagDomains := make(map[string]map[string]int)

	for _, ans := range attempt.Answers {
		qID, err := strconv.Atoi(ans.QuestionID)
		if err != nil {
			slog.Warn("invalid questionId", "questionId", ans.QuestionID)
			continue
		}

		q, ok := qMap[qID]
		if !ok {
			slog.Warn("question not found", "questionId", qID, "testId", attempt.TestID)
			continue
		}

		correct := ans.UserAnswerIndex == q.CorrectAnswerIndex

		inc(domains, q.Domain, correct)
		inc(qTypes, q.QuestionType, correct)
		inc(traps, q.TrapType, correct)
		inc(lengths, q.StemLength, correct)

		for _, tag := range q.Tags {
			inc(tags, tag, correct)
			if tagDomains[tag] == nil {
				tagDomains[tag] = make(map[string]int)
			}
			tagDomains[tag][q.Domain]++
		}
	}

	return AttemptAnalytics{
		AttemptIndex:       idx,
		TestID:             attempt.TestID,
		IsRetake:           isRetake,
		RetakeNumber:       retakeNum,
		Label:              label,
		FileLabel:          fileLabel,
		Date:               attempt.FinishedAt,
		Score:              attempt.Score,
		Total:              attempt.TotalQuestions,
		DomainScores:       toSortedScores(domains, sortAlpha),
		QuestionTypeScores: toSortedScores(qTypes, sortByPctAsc),
		TrapTypeScores:     toSortedScores(traps, sortByPctAsc),
		StemLengthScores:   toSortedScores(lengths, sortFixedLength),
		TagScores:          toTagScores(tags, tagDomains),
	}
}

func inc(m map[string]*counter, key string, correct bool) {
	if key == "" {
		return
	}
	c, ok := m[key]
	if !ok {
		c = &counter{}
		m[key] = c
	}
	c.total++
	if correct {
		c.correct++
	}
}

type sortMode int

const (
	sortAlpha sortMode = iota
	sortByPctAsc
	sortFixedLength
)

var lengthOrder = map[string]int{"short": 0, "medium": 1, "long": 2}

func toSortedScores(m map[string]*counter, mode sortMode) []DimensionScore {
	scores := make([]DimensionScore, 0, len(m))
	for label, c := range m {
		scores = append(scores, DimensionScore{Label: label, Correct: c.correct, Total: c.total})
	}

	switch mode {
	case sortAlpha:
		sort.Slice(scores, func(i, j int) bool {
			return scores[i].Label < scores[j].Label
		})
	case sortByPctAsc:
		sort.Slice(scores, func(i, j int) bool {
			return scores[i].Pct() < scores[j].Pct()
		})
	case sortFixedLength:
		sort.Slice(scores, func(i, j int) bool {
			return lengthOrder[scores[i].Label] < lengthOrder[scores[j].Label]
		})
	}

	return scores
}

func toTagScores(tags map[string]*counter, tagDomains map[string]map[string]int) []TagScore {
	scores := make([]TagScore, 0, len(tags))
	for tag, c := range tags {
		domain := primaryDomain(tagDomains[tag])
		scores = append(scores, TagScore{Tag: tag, Correct: c.correct, Total: c.total, Domain: domain})
	}
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Tag < scores[j].Tag
	})
	return scores
}

func primaryDomain(domainCounts map[string]int) string {
	var best string
	var bestCount int
	for d, c := range domainCounts {
		if c > bestCount {
			best = d
			bestCount = c
		}
	}
	return best
}

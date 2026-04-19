// ©AngelaMos | 2026
// tags.go

package analytics

import "sort"

func BucketTags(tags []TagScore) TagBuckets {
	var b TagBuckets
	for _, t := range tags {
		pct := t.Pct()
		switch {
		case t.Correct == 0:
			b.Zero = append(b.Zero, t)
		case pct < 50:
			b.Low = append(b.Low, t)
		case t.Correct == t.Total:
			b.Perfect = append(b.Perfect, t)
		default:
			b.Mid = append(b.Mid, t)
		}
	}

	sort.Slice(b.Zero, func(i, j int) bool {
		if b.Zero[i].Total != b.Zero[j].Total {
			return b.Zero[i].Total > b.Zero[j].Total
		}
		return b.Zero[i].Tag < b.Zero[j].Tag
	})

	sort.Slice(b.Low, func(i, j int) bool {
		return b.Low[i].Pct() < b.Low[j].Pct()
	})

	sort.Slice(b.Mid, func(i, j int) bool {
		return b.Mid[i].Pct() < b.Mid[j].Pct()
	})

	sort.Slice(b.Perfect, func(i, j int) bool {
		if b.Perfect[i].Total != b.Perfect[j].Total {
			return b.Perfect[i].Total > b.Perfect[j].Total
		}
		return b.Perfect[i].Tag < b.Perfect[j].Tag
	})

	return b
}

var domainOrder = []string{
	"1.0 General Security Concepts",
	"2.0 Threats, Vulnerabilities, and Mitigations",
	"3.0 Security Architecture",
	"4.0 Security Operations",
	"5.0 Security Program Management and Oversight",
}

func GroupZeroPercentTags(tags []TagScore) []TagGroup {
	grouped := make(map[string][]string)
	for _, t := range tags {
		if t.Correct != 0 {
			continue
		}
		domain := t.Domain
		if domain == "" {
			domain = "Other"
		}
		grouped[domain] = append(grouped[domain], t.Tag)
	}

	var groups []TagGroup
	for _, d := range domainOrder {
		if tags, ok := grouped[d]; ok {
			sort.Strings(tags)
			groups = append(groups, TagGroup{Theme: d, Tags: tags})
		}
	}
	if tags, ok := grouped["Other"]; ok {
		sort.Strings(tags)
		groups = append(groups, TagGroup{Theme: "Other", Tags: tags})
	}

	return groups
}

func MultiQuestionMidRange(tags []TagScore) []TagScore {
	var result []TagScore
	for _, t := range tags {
		if t.Total > 1 {
			result = append(result, t)
		}
	}
	return result
}

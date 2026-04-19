// ©AngelaMos | 2026
// models.go

package analytics

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type User struct {
	ID       bson.ObjectID `bson:"_id"`
	Username string        `bson:"username"`
	Email    string        `bson:"email"`
}

type TestQuestion struct {
	ID                 int      `bson:"id"`
	Question           string   `bson:"question"`
	Options            []string `bson:"options"`
	CorrectAnswerIndex int      `bson:"correctAnswerIndex"`
	Explanation        string   `bson:"explanation"`
	ExamTip            string   `bson:"examTip"`
	Domain             string   `bson:"domain"`
	QuestionType       string   `bson:"questionType"`
	StemLength         string   `bson:"stemLength"`
	TrapType           string   `bson:"trapType"`
	Tags               []string `bson:"tags"`
}

type Test struct {
	ID        bson.ObjectID  `bson:"_id"`
	TestID    int            `bson:"testId"`
	Category  string         `bson:"category"`
	Title     string         `bson:"title"`
	Questions []TestQuestion `bson:"questions"`
}

type AttemptAnswer struct {
	QuestionID         string `bson:"questionId"`
	UserAnswerIndex    int    `bson:"userAnswerIndex"`
	CorrectAnswerIndex int    `bson:"correctAnswerIndex"`
}

type TestAttempt struct {
	ID             bson.ObjectID   `bson:"_id"`
	UserID         bson.ObjectID   `bson:"userId"`
	TestID         int             `bson:"testId"`
	Category       string          `bson:"category"`
	Score          int             `bson:"score"`
	TotalQuestions int             `bson:"totalQuestions"`
	Finished       bool            `bson:"finished"`
	FinishedAt     time.Time       `bson:"finishedAt"`
	CreatedAt      time.Time       `bson:"createdAt"`
	Answers        []AttemptAnswer `bson:"answers"`
}

type DimensionScore struct {
	Label   string
	Correct int
	Total   int
}

func (d DimensionScore) Pct() float64 {
	if d.Total == 0 {
		return 0
	}
	return float64(d.Correct) / float64(d.Total) * 100
}

func (d DimensionScore) PctInt() int {
	return int(d.Pct() + 0.5)
}

type TagScore struct {
	Tag     string
	Correct int
	Total   int
	Domain  string
}

func (t TagScore) Pct() float64 {
	if t.Total == 0 {
		return 0
	}
	return float64(t.Correct) / float64(t.Total) * 100
}

func (t TagScore) PctInt() int {
	return int(t.Pct() + 0.5)
}

type AttemptAnalytics struct {
	AttemptIndex int
	TestID       int
	IsRetake     bool
	RetakeNumber int
	Label        string
	FileLabel    string
	Date         time.Time
	Score        int
	Total        int

	DomainScores       []DimensionScore
	QuestionTypeScores []DimensionScore
	TrapTypeScores     []DimensionScore
	StemLengthScores   []DimensionScore
	TagScores          []TagScore
}

type UserAnalytics struct {
	User     User
	Attempts []AttemptAnalytics
}

type TagGroup struct {
	Theme string
	Tags  []string
}

type TagBuckets struct {
	Zero     []TagScore
	Low      []TagScore
	Mid      []TagScore
	Perfect  []TagScore
}

type TrajectoryRow struct {
	Metric string
	Values []string
}

type SummaryBlock struct {
	LockedIn   []string
	NeedsWork  []string
	FocusAreas []string
	Blockquote string
}

type AttemptCommentary struct {
	TrajectoryLine         string
	DomainCommentary       string
	QuestionTypeCommentary string
	TrapTypeCommentary     string
	StemLengthCommentary   string
	TagGroups              []TagGroup
	MidRangeTags           []TagScore
	StrongTags             []string
	NotableImprovements    []string
	TrajectoryRows         []TrajectoryRow
	Summary                SummaryBlock
}

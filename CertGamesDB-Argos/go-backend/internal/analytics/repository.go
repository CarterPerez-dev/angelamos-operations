// ©AngelaMos | 2026
// repository.go

package analytics

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"github.com/carterperez-dev/templates/go-backend/internal/mongodb"
)

type Repository struct {
	client   *mongodb.Client
	database string
}

func NewRepository(client *mongodb.Client, database string) *Repository {
	return &Repository{client: client, database: database}
}

func (r *Repository) FindUser(ctx context.Context, identifier string) (*User, error) {
	filter := bson.D{
		{Key: "$or", Value: bson.A{
			bson.D{{Key: "email", Value: identifier}},
			bson.D{{Key: "username", Value: identifier}},
		}},
	}

	var user User
	err := r.client.Database(r.database).Collection("mainusers").FindOne(ctx, filter).Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("find user %q: %w", identifier, err)
	}
	return &user, nil
}

func (r *Repository) FindFinishedAttempts(ctx context.Context, userID bson.ObjectID, category string) ([]TestAttempt, error) {
	filter := bson.D{
		{Key: "userId", Value: userID},
		{Key: "finished", Value: true},
		{Key: "category", Value: category},
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "finishedAt", Value: 1}})

	cursor, err := r.client.Database(r.database).Collection("testAttempts").Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("find test attempts: %w", err)
	}
	defer cursor.Close(ctx)

	var attempts []TestAttempt
	if err := cursor.All(ctx, &attempts); err != nil {
		return nil, fmt.Errorf("decode test attempts: %w", err)
	}
	return attempts, nil
}

func (r *Repository) FindTestsByIDs(ctx context.Context, testIDs []int, category string) (map[int]*Test, error) {
	filter := bson.D{
		{Key: "testId", Value: bson.D{{Key: "$in", Value: testIDs}}},
		{Key: "category", Value: category},
	}

	cursor, err := r.client.Database(r.database).Collection("tests").Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("find tests: %w", err)
	}
	defer cursor.Close(ctx)

	var tests []Test
	if err := cursor.All(ctx, &tests); err != nil {
		return nil, fmt.Errorf("decode tests: %w", err)
	}

	result := make(map[int]*Test, len(tests))
	for i := range tests {
		result[tests[i].TestID] = &tests[i]
	}
	return result, nil
}

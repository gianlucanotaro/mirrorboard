package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type User struct {
	ID             bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name           string        `bson:"name" json:"name"`
	HabiticaUserID string        `bson:"habitica_user_id" json:"habitica_user_id"`
	HabiticaToken  string        `bson:"habitica_api_token" json:"habitica_api_token"`
	CreatedAt      time.Time     `bson:"created_at" json:"created_at"`
}

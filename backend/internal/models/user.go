package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ServiceAuth holds credentials for one external service.
// Field values are stored encrypted in MongoDB.
// AuthType hints at the shape of Fields:
//   - "api_token"   → e.g. { "token": "..." }
//   - "credentials" → e.g. { "username": "...", "password": "..." }
//   - "oauth"       → e.g. { "access_token": "...", "refresh_token": "..." }
type ServiceAuth struct {
	AuthType string            `bson:"auth_type" json:"auth_type"`
	Fields   map[string]string `bson:"fields" json:"fields"`
}

type User struct {
	ID        bson.ObjectID          `bson:"_id,omitempty" json:"id"`
	Name      string                 `bson:"name" json:"name"`
	Services  map[string]ServiceAuth `bson:"services,omitempty" json:"services,omitempty"`
	CreatedAt time.Time              `bson:"created_at" json:"created_at"`
}

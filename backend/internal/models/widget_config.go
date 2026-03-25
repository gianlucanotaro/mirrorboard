package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// WidgetConfig stores per-user configuration for a widget.
// Config is a flexible document so each widget type can store different fields.
type WidgetConfig struct {
	ID         bson.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID     bson.ObjectID `bson:"user_id" json:"user_id"`
	WidgetType string        `bson:"widget_type" json:"widget_type"`
	Config     bson.M        `bson:"config" json:"config"`
	UpdatedAt  time.Time     `bson:"updated_at" json:"updated_at"`
}

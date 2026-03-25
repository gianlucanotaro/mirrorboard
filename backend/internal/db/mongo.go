package db

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var Client *mongo.Client
var Database *mongo.Database

func Connect() {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}
	dbName := os.Getenv("MONGODB_DB")
	if dbName == "" {
		dbName = "mirrorboard"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatalf("MongoDB connect error: %v", err)
	}
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("MongoDB ping error: %v", err)
	}

	Client = client
	Database = client.Database(dbName)
	log.Printf("Connected to MongoDB: %s/%s", uri, dbName)
}

func Disconnect() {
	if Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = Client.Disconnect(ctx)
	}
}

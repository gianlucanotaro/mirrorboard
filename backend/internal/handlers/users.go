package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gianlucanotaro/mirrorboard/internal/db"
	"github.com/gianlucanotaro/mirrorboard/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func ListUsers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	cursor, err := db.Database.Collection("users").Find(ctx, bson.M{})
	if err != nil {
		http.Error(w, "failed to fetch users", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		http.Error(w, "failed to decode users", http.StatusInternalServerError)
		return
	}
	if users == nil {
		users = []models.User{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var input models.User
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if input.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	input.ID = bson.NewObjectID()
	input.CreatedAt = time.Now()

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if _, err := db.Database.Collection("users").InsertOne(ctx, input); err != nil {
		http.Error(w, "failed to create user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(input)
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user models.User
	err = db.Database.Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	var input struct {
		Name           string `json:"name"`
		HabiticaUserID string `json:"habitica_user_id"`
		HabiticaToken  string `json:"habitica_api_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	update := bson.M{}
	if input.Name != "" {
		update["name"] = input.Name
	}
	if input.HabiticaUserID != "" {
		update["habitica_user_id"] = input.HabiticaUserID
	}
	if input.HabiticaToken != "" {
		update["habitica_api_token"] = input.HabiticaToken
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	res, err := db.Database.Collection("users").UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil || res.MatchedCount == 0 {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

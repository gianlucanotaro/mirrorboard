package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gianlucanotaro/mirrorboard/internal/config"
	"github.com/gianlucanotaro/mirrorboard/internal/crypto"
	"github.com/gianlucanotaro/mirrorboard/internal/db"
	"github.com/gianlucanotaro/mirrorboard/internal/models"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// GetServices returns the services connected to a user.
// Field values are redacted — only field names and auth_type are exposed.
func GetServices(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), config.DBOperationTimeout)
	defer cancel()

	var user models.User
	if err := db.Database.Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&user); err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	// Return service names + auth_type + field keys only (no values)
	type safeService struct {
		AuthType   string   `json:"auth_type"`
		FieldNames []string `json:"field_names"`
	}
	out := make(map[string]safeService, len(user.Services))
	for name, svc := range user.Services {
		keys := make([]string, 0, len(svc.Fields))
		for k := range svc.Fields {
			keys = append(keys, k)
		}
		out[name] = safeService{AuthType: svc.AuthType, FieldNames: keys}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}

// UpsertService adds or replaces a service's credentials for a user.
// Field values are encrypted before storage.
func UpsertService(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}
	serviceName := r.PathValue("service")
	if serviceName == "" {
		http.Error(w, "service name is required", http.StatusBadRequest)
		return
	}

	var input models.ServiceAuth
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if input.AuthType == "" {
		http.Error(w, "auth_type is required", http.StatusBadRequest)
		return
	}
	if len(input.Fields) == 0 {
		http.Error(w, "fields must not be empty", http.StatusBadRequest)
		return
	}

	encryptedFields, err := crypto.EncryptMap(crypto.AppKey, input.Fields)
	if err != nil {
		http.Error(w, "failed to encrypt credentials", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), config.DBOperationTimeout)
	defer cancel()

	key := "services." + serviceName
	res, err := db.Database.Collection("users").UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{key: models.ServiceAuth{
			AuthType: input.AuthType,
			Fields:   encryptedFields,
		}}},
	)
	if err != nil || res.MatchedCount == 0 {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteService removes a service's credentials from a user.
func DeleteService(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}
	serviceName := r.PathValue("service")

	ctx, cancel := context.WithTimeout(r.Context(), config.DBOperationTimeout)
	defer cancel()

	key := "services." + serviceName
	res, err := db.Database.Collection("users").UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$unset": bson.M{key: ""}},
	)
	if err != nil || res.MatchedCount == 0 {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DecryptedFields is a helper for internal use (e.g. when calling external APIs).
// It returns the decrypted field values for a given user+service.
func DecryptedFields(userID bson.ObjectID, serviceName string) (map[string]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), config.DBOperationTimeout)
	defer cancel()

	var user models.User
	if err := db.Database.Collection("users").FindOne(ctx, bson.M{"_id": userID}).Decode(&user); err != nil {
		return nil, err
	}

	svc, ok := user.Services[serviceName]
	if !ok {
		return nil, nil
	}

	return crypto.DecryptMap(crypto.AppKey, svc.Fields)
}

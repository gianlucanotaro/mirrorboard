package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gianlucanotaro/mirrorboard/internal/habitica"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func GetHabiticaTasks(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	fields, err := DecryptedFields(id, "habitica")
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	if fields == nil {
		http.Error(w, "habitica not connected for this user", http.StatusNotFound)
		return
	}

	client := habitica.NewClient(fields["user_id"], fields["token"])
	tasks, err := client.GetAllTasks()
	if err != nil {
		http.Error(w, "failed to fetch tasks from Habitica", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

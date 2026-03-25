package handlers

import (
	"encoding/json"
	"net/http"

	googleinternal "github.com/gianlucanotaro/mirrorboard/internal/google"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func GetCalendarToday(w http.ResponseWriter, r *http.Request) {
	id, err := bson.ObjectIDFromHex(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	fields, err := DecryptedFields(id, "google_calendar")
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	if fields == nil {
		http.Error(w, "google calendar not connected", http.StatusNotFound)
		return
	}

	cfg := googleinternal.OAuthConfig()
	token := googleinternal.TokenFromFields(fields)

	events, err := googleinternal.GetTodayEvents(r.Context(), cfg, token)
	if err != nil {
		http.Error(w, "failed to fetch calendar events", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

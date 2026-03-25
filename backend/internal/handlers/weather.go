package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gianlucanotaro/mirrorboard/internal/weather"
)

func GetWeather(w http.ResponseWriter, r *http.Request) {
	data, err := weather.Fetch()
	if err != nil {
		http.Error(w, "failed to fetch weather", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

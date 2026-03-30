package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gianlucanotaro/mirrorboard/internal/config"
	"github.com/gianlucanotaro/mirrorboard/internal/crypto"
	"github.com/gianlucanotaro/mirrorboard/internal/db"
	"github.com/gianlucanotaro/mirrorboard/internal/handlers"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present (ignored in production where vars are set by the environment)
	_ = godotenv.Load("../.env")

	if err := crypto.LoadKey(); err != nil {
		log.Fatalf("Encryption key error: %v", err)
	}

	db.Connect()
	defer db.Disconnect()

	port := os.Getenv("PORT")
	if port == "" {
		port = config.DefaultPort
	}

	mux := http.NewServeMux()

	// CORS for local dev (frontend on :5173 → backend on :8080)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", config.CORSAllowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		mux.ServeHTTP(w, r)
	})

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok"}`)
	})

	// Users
	mux.HandleFunc("GET /api/users", handlers.ListUsers)
	mux.HandleFunc("POST /api/users", handlers.CreateUser)
	mux.HandleFunc("GET /api/users/{id}", handlers.GetUser)
	mux.HandleFunc("PUT /api/users/{id}", handlers.UpdateUser)

	// Services (credentials per user, stored encrypted)
	mux.HandleFunc("GET /api/users/{id}/services", handlers.GetServices)
	mux.HandleFunc("PUT /api/users/{id}/services/{service}", handlers.UpsertService)
	mux.HandleFunc("DELETE /api/users/{id}/services/{service}", handlers.DeleteService)

	// Habitica
	mux.HandleFunc("GET /api/users/{id}/habitica/tasks", handlers.GetHabiticaTasks)

	// Google Calendar
	mux.HandleFunc("GET /api/users/{id}/auth/google", handlers.StartGoogleAuth)
	mux.HandleFunc("GET /api/auth/google/callback", handlers.GoogleCallback)
	mux.HandleFunc("GET /api/users/{id}/calendar/today", handlers.GetCalendarToday)

	// Weather
	mux.HandleFunc("GET /api/weather", handlers.GetWeather)

	log.Printf("MirrorBoard backend running on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}

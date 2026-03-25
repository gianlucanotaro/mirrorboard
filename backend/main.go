package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gianlucanotaro/mirrorboard/internal/db"
	"github.com/gianlucanotaro/mirrorboard/internal/handlers"
)

func main() {
	db.Connect()
	defer db.Disconnect()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok"}`)
	})

	// Users
	mux.HandleFunc("GET /api/users", handlers.ListUsers)
	mux.HandleFunc("POST /api/users", handlers.CreateUser)
	mux.HandleFunc("GET /api/users/{id}", handlers.GetUser)
	mux.HandleFunc("PUT /api/users/{id}", handlers.UpdateUser)

	log.Printf("MirrorBoard backend running on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

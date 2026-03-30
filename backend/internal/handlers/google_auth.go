package handlers

import (
	"context"
	"net/http"

	"github.com/gianlucanotaro/mirrorboard/internal/config"
	googleinternal "github.com/gianlucanotaro/mirrorboard/internal/google"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/oauth2"

	"github.com/gianlucanotaro/mirrorboard/internal/crypto"
	"github.com/gianlucanotaro/mirrorboard/internal/db"
	"github.com/gianlucanotaro/mirrorboard/internal/models"
)

// StartGoogleAuth redirects the user to Google's OAuth consent screen.
// The user ID is passed as the OAuth state so we know who to link on callback.
func StartGoogleAuth(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if _, err := bson.ObjectIDFromHex(userID); err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	cfg := googleinternal.OAuthConfig()
	url := cfg.AuthCodeURL(userID, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// GoogleCallback handles the redirect from Google after the user grants access.
// It exchanges the code for tokens and stores them encrypted in MongoDB.
func GoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	userID := r.URL.Query().Get("state")

	if code == "" || userID == "" {
		http.Error(w, "missing code or state", http.StatusBadRequest)
		return
	}

	id, err := bson.ObjectIDFromHex(userID)
	if err != nil {
		http.Error(w, "invalid user id in state", http.StatusBadRequest)
		return
	}

	cfg := googleinternal.OAuthConfig()
	ctx, cancel := context.WithTimeout(r.Context(), config.OAuthTimeout)
	defer cancel()

	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		http.Error(w, "failed to exchange token", http.StatusInternalServerError)
		return
	}

	encryptedFields, err := crypto.EncryptMap(crypto.AppKey, map[string]string{
		"access_token":  token.AccessToken,
		"refresh_token": token.RefreshToken,
	})
	if err != nil {
		http.Error(w, "failed to encrypt tokens", http.StatusInternalServerError)
		return
	}

	dbCtx, dbCancel := context.WithTimeout(context.Background(), config.DBOperationTimeout)
	defer dbCancel()

	res, err := db.Database.Collection("users").UpdateOne(
		dbCtx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"services.google_calendar": models.ServiceAuth{
			AuthType: "oauth",
			Fields:   encryptedFields,
		}}},
	)
	if err != nil || res.MatchedCount == 0 {
		http.Error(w, "failed to save tokens", http.StatusInternalServerError)
		return
	}

	// Redirect back to the frontend dashboard
	http.Redirect(w, r, config.CORSAllowedOrigin, http.StatusTemporaryRedirect)
}

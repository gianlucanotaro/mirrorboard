package google

import (
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	googlecalendar "google.golang.org/api/calendar/v3"
)

func OAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URI"),
		Scopes:       []string{googlecalendar.CalendarReadonlyScope},
		Endpoint:     google.Endpoint,
	}
}

func TokenFromFields(fields map[string]string) *oauth2.Token {
	return &oauth2.Token{
		AccessToken:  fields["access_token"],
		RefreshToken: fields["refresh_token"],
		TokenType:    "Bearer",
	}
}

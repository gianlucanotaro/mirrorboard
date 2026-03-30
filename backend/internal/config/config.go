package config

import "time"

// Server
const (
	DefaultPort       = "8080"
	CORSAllowedOrigin = "http://localhost:5173"
)

// MongoDB defaults (overridden by MONGODB_URI / MONGODB_DB env vars)
const (
	DefaultMongoURI = "mongodb://localhost:27017"
	DefaultMongoDB  = "mirrorboard"
)

// Timeouts
const (
	DBConnectTimeout    = 10 * time.Second
	DBDisconnectTimeout = 5 * time.Second
	DBOperationTimeout  = 5 * time.Second
	HTTPClientTimeout   = 10 * time.Second
	OAuthTimeout        = 10 * time.Second
)

// Habitica
const (
	HabiticaBaseURL  = "https://habitica.com/api/v3"
	HabiticaClientID = "MirrorBoard"
)

// Weather
const (
	WeatherAPIURL       = "https://api.open-meteo.com/v1/forecast"
	WeatherForecastDays = 6
)

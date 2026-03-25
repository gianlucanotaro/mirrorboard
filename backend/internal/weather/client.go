package weather

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

const apiURL = "https://api.open-meteo.com/v1/forecast"

type Current struct {
	Temperature        float64 `json:"temperature"`
	ApparentTemp       float64 `json:"apparent_temperature"`
	WeatherCode        int     `json:"weather_code"`
	Condition          string  `json:"condition"`
	Icon               string  `json:"icon"`
}

type ForecastDay struct {
	Date string  `json:"date"` // e.g. "Mon"
	Icon string  `json:"icon"`
	High float64 `json:"high"`
	Low  float64 `json:"low"`
}

type Weather struct {
	Location string        `json:"location"`
	Current  Current       `json:"current"`
	TodayHigh float64      `json:"today_high"`
	TodayLow  float64      `json:"today_low"`
	Forecast  []ForecastDay `json:"forecast"` // next 5 days
}

func Fetch() (*Weather, error) {
	lat := os.Getenv("WEATHER_LAT")
	lon := os.Getenv("WEATHER_LON")
	if lat == "" || lon == "" {
		return nil, fmt.Errorf("WEATHER_LAT and WEATHER_LON must be set")
	}
	location := os.Getenv("WEATHER_LOCATION")
	if location == "" {
		location = "Unknown"
	}

	url := fmt.Sprintf(
		"%s?latitude=%s&longitude=%s"+
			"&current=temperature_2m,apparent_temperature,weather_code"+
			"&daily=weather_code,temperature_2m_max,temperature_2m_min"+
			"&timezone=auto&forecast_days=6",
		apiURL, lat, lon,
	)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("open-meteo returned %d", resp.StatusCode)
	}

	var raw struct {
		Current struct {
			Temperature  float64 `json:"temperature_2m"`
			ApparentTemp float64 `json:"apparent_temperature"`
			WeatherCode  int     `json:"weather_code"`
		} `json:"current"`
		Daily struct {
			Time        []string  `json:"time"`
			WeatherCode []int     `json:"weather_code"`
			TempMax     []float64 `json:"temperature_2m_max"`
			TempMin     []float64 `json:"temperature_2m_min"`
		} `json:"daily"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}

	w := &Weather{
		Location: location,
		Current: Current{
			Temperature:  raw.Current.Temperature,
			ApparentTemp: raw.Current.ApparentTemp,
			WeatherCode:  raw.Current.WeatherCode,
			Condition:    codeToCondition(raw.Current.WeatherCode),
			Icon:         codeToIcon(raw.Current.WeatherCode),
		},
	}

	if len(raw.Daily.TempMax) > 0 {
		w.TodayHigh = raw.Daily.TempMax[0]
		w.TodayLow = raw.Daily.TempMin[0]
	}

	// Days 1–5 (skip index 0 = today)
	for i := 1; i <= 5 && i < len(raw.Daily.Time); i++ {
		t, _ := time.Parse("2006-01-02", raw.Daily.Time[i])
		w.Forecast = append(w.Forecast, ForecastDay{
			Date: t.Format("Mon"),
			Icon: codeToIcon(raw.Daily.WeatherCode[i]),
			High: raw.Daily.TempMax[i],
			Low:  raw.Daily.TempMin[i],
		})
	}

	return w, nil
}

// WMO weather code → human-readable condition
func codeToCondition(code int) string {
	switch {
	case code == 0:
		return "Clear sky"
	case code == 1:
		return "Mainly clear"
	case code == 2:
		return "Partly cloudy"
	case code == 3:
		return "Overcast"
	case code == 45 || code == 48:
		return "Foggy"
	case code >= 51 && code <= 55:
		return "Drizzle"
	case code >= 61 && code <= 65:
		return "Rain"
	case code >= 71 && code <= 75:
		return "Snow"
	case code == 77:
		return "Snow grains"
	case code >= 80 && code <= 82:
		return "Rain showers"
	case code >= 85 && code <= 86:
		return "Snow showers"
	case code == 95:
		return "Thunderstorm"
	case code == 96 || code == 99:
		return "Thunderstorm with hail"
	default:
		return "Unknown"
	}
}

// WMO weather code → emoji icon
func codeToIcon(code int) string {
	switch {
	case code == 0:
		return "☀️"
	case code == 1 || code == 2:
		return "🌤️"
	case code == 3:
		return "☁️"
	case code == 45 || code == 48:
		return "🌫️"
	case code >= 51 && code <= 55:
		return "🌦️"
	case code >= 61 && code <= 65:
		return "🌧️"
	case code >= 71 && code <= 77:
		return "❄️"
	case code >= 80 && code <= 82:
		return "🌦️"
	case code >= 85 && code <= 86:
		return "🌨️"
	case code >= 95:
		return "⛈️"
	default:
		return "🌡️"
	}
}

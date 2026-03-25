package google

import (
	"context"
	"sort"
	"time"

	"golang.org/x/oauth2"
	googlecalendar "google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

type Event struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Calendar string `json:"calendar"`
	Color    string `json:"color"` // calendar background color hex
	AllDay   bool   `json:"all_day"`
	Start    string `json:"start"` // RFC3339 or date string
	End      string `json:"end"`
}

func GetTodayEvents(ctx context.Context, cfg *oauth2.Config, token *oauth2.Token) ([]Event, error) {
	tokenSource := cfg.TokenSource(ctx, token)
	svc, err := googlecalendar.NewService(ctx, option.WithTokenSource(tokenSource))
	if err != nil {
		return nil, err
	}

	// Fetch the color palette so we can resolve colorId → hex
	colorMap, err := buildColorMap(ctx, svc)
	if err != nil {
		colorMap = map[string]string{} // non-fatal, fall back to default
	}

	// Time window: midnight → end of today in local time
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	calList, err := svc.CalendarList.List().Do()
	if err != nil {
		return nil, err
	}

	var events []Event
	for _, cal := range calList.Items {
		color := resolveColor(cal.BackgroundColor, cal.ColorId, colorMap)

		items, err := svc.Events.List(cal.Id).
			TimeMin(startOfDay.Format(time.RFC3339)).
			TimeMax(endOfDay.Format(time.RFC3339)).
			SingleEvents(true).
			OrderBy("startTime").
			Do()
		if err != nil {
			continue
		}

		for _, item := range items.Items {
			e := Event{
				ID:       item.Id,
				Title:    item.Summary,
				Calendar: cal.Summary,
				Color:    color,
			}
			if item.Start.DateTime != "" {
				e.Start = item.Start.DateTime
				e.End = item.End.DateTime
			} else {
				e.AllDay = true
				e.Start = item.Start.Date
				e.End = item.End.Date
			}
			events = append(events, e)
		}
	}

	sort.Slice(events, func(i, j int) bool {
		return events[i].Start < events[j].Start
	})

	if events == nil {
		events = []Event{}
	}
	return events, nil
}

// buildColorMap calls the Colors API and returns a map of colorId → hex for calendars.
func buildColorMap(ctx context.Context, svc *googlecalendar.Service) (map[string]string, error) {
	colors, err := svc.Colors.Get().Do()
	if err != nil {
		return nil, err
	}
	m := make(map[string]string, len(colors.Calendar))
	for id, c := range colors.Calendar {
		m[id] = c.Background
	}
	return m, nil
}

// resolveColor picks the best available color for a calendar entry.
// Priority: explicit backgroundColor > colorId lookup > fallback grey.
func resolveColor(backgroundColor, colorId string, colorMap map[string]string) string {
	if backgroundColor != "" {
		return backgroundColor
	}
	if colorId != "" {
		if hex, ok := colorMap[colorId]; ok {
			return hex
		}
	}
	return "#4a4a4a"
}

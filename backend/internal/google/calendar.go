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
	ID        string `json:"id"`
	Title     string `json:"title"`
	Calendar  string `json:"calendar"`
	AllDay    bool   `json:"all_day"`
	Start     string `json:"start"` // RFC3339 or date string
	End       string `json:"end"`
}

func GetTodayEvents(ctx context.Context, cfg *oauth2.Config, token *oauth2.Token) ([]Event, error) {
	tokenSource := cfg.TokenSource(ctx, token)
	svc, err := googlecalendar.NewService(ctx, option.WithTokenSource(tokenSource))
	if err != nil {
		return nil, err
	}

	// Time window: midnight → end of today in local time
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	// Fetch all calendars
	calList, err := svc.CalendarList.List().Do()
	if err != nil {
		return nil, err
	}

	var events []Event
	for _, cal := range calList.Items {
		items, err := svc.Events.List(cal.Id).
			TimeMin(startOfDay.Format(time.RFC3339)).
			TimeMax(endOfDay.Format(time.RFC3339)).
			SingleEvents(true).
			OrderBy("startTime").
			Do()
		if err != nil {
			continue // skip calendars we can't read, don't fail everything
		}

		for _, item := range items.Items {
			e := Event{
				ID:       item.Id,
				Title:    item.Summary,
				Calendar: cal.Summary,
			}
			if item.Start.DateTime != "" {
				e.Start = item.Start.DateTime
				e.End = item.End.DateTime
			} else {
				// All-day event
				e.AllDay = true
				e.Start = item.Start.Date
				e.End = item.End.Date
			}
			events = append(events, e)
		}
	}

	// Sort merged results by start time
	sort.Slice(events, func(i, j int) bool {
		return events[i].Start < events[j].Start
	})

	if events == nil {
		events = []Event{}
	}
	return events, nil
}

package habitica

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

const (
	baseURL     = "https://habitica.com/api/v3"
	clientID    = "MirrorBoard"
	httpTimeout = 10 * time.Second
)

type Client struct {
	userID string
	token  string
	http   *http.Client
}

func NewClient(userID, token string) *Client {
	return &Client{
		userID: userID,
		token:  token,
		http:   &http.Client{Timeout: httpTimeout},
	}
}

type Habit struct {
	ID         string  `json:"id"`
	Text       string  `json:"text"`
	Notes      string  `json:"notes"`
	Up         bool    `json:"up"`
	Down       bool    `json:"down"`
	CounterUp  int     `json:"counterUp"`
	CounterDown int    `json:"counterDown"`
	Priority   float64 `json:"priority"`
}

type Daily struct {
	ID        string  `json:"id"`
	Text      string  `json:"text"`
	Notes     string  `json:"notes"`
	Completed bool    `json:"completed"`
	IsDue     bool    `json:"isDue"`
	Streak    int     `json:"streak"`
	Priority  float64 `json:"priority"`
}

type Todo struct {
	ID        string  `json:"id"`
	Text      string  `json:"text"`
	Notes     string  `json:"notes"`
	Completed bool    `json:"completed"`
	Priority  float64 `json:"priority"`
}

type AllTasks struct {
	Habits  []Habit `json:"habits"`
	Dailies []Daily `json:"dailies"`
	Todos   []Todo  `json:"todos"`
}

// GetAllTasks fetches habits, dailies, and todos in parallel.
func (c *Client) GetAllTasks() (*AllTasks, error) {
	var (
		habits  []Habit
		dailies []Daily
		todos   []Todo
		errs    [3]error
		wg      sync.WaitGroup
	)

	wg.Add(3)
	go func() { defer wg.Done(); habits, errs[0] = fetchTasks[Habit](c, "habits") }()
	go func() { defer wg.Done(); dailies, errs[1] = fetchTasks[Daily](c, "dailys") }()
	go func() { defer wg.Done(); todos, errs[2] = fetchTasks[Todo](c, "todos") }()
	wg.Wait()

	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}

	return &AllTasks{
		Habits:  nilToEmpty(habits),
		Dailies: nilToEmpty(dailies),
		Todos:   nilToEmpty(todos),
	}, nil
}

func fetchTasks[T any](c *Client, taskType string) ([]T, error) {
	req, err := http.NewRequest("GET", baseURL+"/tasks/user?type="+taskType, nil)
	if err != nil {
		return nil, err
	}
	c.setHeaders(req)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("habitica API returned %d for type=%s", resp.StatusCode, taskType)
	}

	var result struct {
		Success bool  `json:"success"`
		Data    []T   `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if !result.Success {
		return nil, fmt.Errorf("habitica API returned success=false for type=%s", taskType)
	}

	return result.Data, nil
}

func nilToEmpty[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}

func (c *Client) setHeaders(r *http.Request) {
	r.Header.Set("x-api-user", c.userID)
	r.Header.Set("x-api-key", c.token)
	r.Header.Set("x-client", c.userID+"-"+clientID)
	r.Header.Set("Content-Type", "application/json")
}

package habitica

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const (
	baseURL   = "https://habitica.com/api/v3"
	clientID  = "MirrorBoard"
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

type Todo struct {
	ID        string `json:"id"`
	Text      string `json:"text"`
	Notes     string `json:"notes"`
	Completed bool   `json:"completed"`
	Priority  float64 `json:"priority"`
}

func (c *Client) GetTodos() ([]Todo, error) {
	req, err := http.NewRequest("GET", baseURL+"/tasks/user?type=todos", nil)
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
		return nil, fmt.Errorf("habitica API returned %d", resp.StatusCode)
	}

	var result struct {
		Success bool   `json:"success"`
		Data    []Todo `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if !result.Success {
		return nil, fmt.Errorf("habitica API returned success=false")
	}

	return result.Data, nil
}

func (c *Client) setHeaders(r *http.Request) {
	r.Header.Set("x-api-user", c.userID)
	r.Header.Set("x-api-key", c.token)
	r.Header.Set("x-client", c.userID+"-"+clientID)
	r.Header.Set("Content-Type", "application/json")
}

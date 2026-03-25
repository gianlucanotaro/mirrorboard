# MirrorBoard

A touchscreen smart planner dashboard designed to run on a mirror display. Built with a dark, minimal aesthetic — clean and readable at a glance.

Users get their own profile with independent credentials and widget configurations. All sensitive data (API keys, tokens) is encrypted at rest using AES-256-GCM.

---

## Features

- **Multi-user** — select your profile on startup, each user has their own data
- **Habitica integration** — habits, dailies, and todos in one widget
- **Encrypted credentials** — service API keys are encrypted in MongoDB, never exposed to the frontend
- **Smart refresh** — dashboard polls every 10 seconds, only updating sections that actually changed
- **Dark theme with design tokens** — retheme the entire app by editing a single block in `style.css`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript, Tailwind CSS v4, Vite |
| Backend | Go (stdlib `net/http`) |
| Database | MongoDB |
| Encryption | AES-256-GCM |

---

## Prerequisites

- [Go](https://go.dev/) 1.23+
- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally on port `27017`

On macOS with Homebrew:
```bash
brew install go node mongodb-community
brew services start mongodb-community
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/gianlucanotaro/mirrorboard.git
cd mirrorboard
```

### 2. Configure environment

```bash
cp .env.example .env
```

Generate an encryption key and add it to `.env`:

```bash
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
```

Your `.env` should look like:

```env
ENCRYPTION_KEY=<64 hex characters>
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=mirrorboard
PORT=8080
```

> **Keep your `ENCRYPTION_KEY` backed up.** If lost, all stored service credentials become unrecoverable.

### 3. Install frontend dependencies

```bash
cd frontend && npm install
```

### 4. Run

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && go run main.go

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Adding a User

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Your Name"}'
```

---

## Connecting Habitica

Find your **User ID** and **API Token** at [habitica.com/user/settings/api](https://habitica.com/user/settings/api), then:

```bash
curl -X PUT http://localhost:8080/api/users/<user-id>/services/habitica \
  -H "Content-Type: application/json" \
  -d '{
    "auth_type": "api_token",
    "fields": {
      "user_id": "<habitica-user-id>",
      "token": "<habitica-api-token>"
    }
  }'
```

Credentials are encrypted before storage. The token never leaves the backend.

---

## Project Structure

```
mirrorboard/
├── backend/
│   ├── main.go                        # Entry point, routing
│   └── internal/
│       ├── crypto/                    # AES-256-GCM encryption + key loader
│       ├── db/                        # MongoDB connection
│       ├── handlers/                  # HTTP handlers
│       │   ├── users.go               # User CRUD
│       │   ├── services.go            # Service credentials (encrypted)
│       │   └── habitica.go            # Habitica proxy handler
│       ├── habitica/
│       │   └── client.go              # Habitica API client
│       └── models/
│           ├── user.go                # User + ServiceAuth models
│           └── widget_config.go       # Widget config model
├── frontend/
│   └── src/
│       ├── main.ts                    # App entry, routing between views
│       ├── api.ts                     # All fetch calls + TypeScript types
│       ├── style.css                  # Design tokens + Tailwind setup
│       └── widgets/
│           └── habitica.ts            # Habitica widget (render + smart refresh)
├── .env.example
└── README.md
```

---

## API Reference

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create a user |
| `GET` | `/api/users/:id` | Get a user |
| `PUT` | `/api/users/:id` | Update a user's name |

### Services

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/:id/services` | List connected services (no secrets) |
| `PUT` | `/api/users/:id/services/:service` | Add or update a service |
| `DELETE` | `/api/users/:id/services/:service` | Remove a service |

### Habitica

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/:id/habitica/tasks` | Fetch habits, dailies, and todos |

---

## Theming

All design tokens live in one place — `frontend/src/style.css`:

```css
@theme {
  --color-bg:         #0d0d0d;
  --color-surface:    #161616;
  --color-border:     #2a2a2a;
  --color-text:       #e8e8e8;
  --color-muted:      #4a4a4a;
  --color-primary:    #5da82d;
  --color-primary-fg: #f0ece0;
}
```

Edit that block to retheme the entire app. No other files need changing.

---

## Security Notes

- API tokens and passwords are encrypted with AES-256-GCM before being written to MongoDB
- The encryption key is loaded from the `ENCRYPTION_KEY` environment variable — never stored in the database
- `GET /services` only returns field **names**, never values
- Decryption happens server-side only, when making outbound API calls
- MongoDB is expected to be bound to `127.0.0.1` only
- Never commit `.env`

---

## Roadmap

- [ ] Calendar widget
- [ ] To-do widget (independent of Habitica)
- [ ] Docker setup
- [ ] Widget layout customisation

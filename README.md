# timely-notify

Minimal calendar dashboard with Google Calendar integration.

**Live:** <https://timely-notify.onrender.com>

## Features

- Displays a 4-week calendar view (1 week before → 3 weeks after today) powered by FullCalendar
- Connects to Google Calendar via OAuth 2.0 (read-only access)
- Highlights important events based on configurable keyword phrases (e.g. "trash", "due date", "house meeting")
- Light/dark mode toggle with persistent preference (saved in localStorage)
- Auto-refreshes events every 10 seconds
- Automatic redirect to Google sign-in when authentication is needed (e.g. after a redeploy)

## Structure

- `frontend/` — HTML + JavaScript single-page app
- `backend/` — Python FastAPI service that handles OAuth and proxies Google Calendar API

## How to Run Locally

```bash
# From the repo root
uvicorn backend.main:app --reload
```

Then visit `http://localhost:8000`.

## Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret |
| `IMPORTANT_PHRASES` | Comma-separated keywords to flag as important events |
| `ENVIRONMENT` | Set to `production` on Render, `local` for development |

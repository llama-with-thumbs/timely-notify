# timely-notify

Minimal calendar notifier.

## Overview

A one-page website that connects to Google Calendar and shows event notifications. Important events (based on keywords) are highlighted separately.

## Structure

- `frontend/` — HTML + JavaScript site
- `backend/` — Python FastAPI service to interact with Google Calendar API

## How to Run Locally

### Backend

From the `backend/` folder:

```bash
uvicorn main:app --reload

## Frontend

python -m http.server 5500
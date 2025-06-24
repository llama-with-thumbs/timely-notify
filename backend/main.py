from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
import os
import requests

# Load environment variables
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
phrases = os.getenv("IMPORTANT_PHRASES", "").split(",")
IMPORTANT_PHRASES = [p.strip().lower() for p in phrases if p.strip()]

user_access_token = None
refresh_token_memory = None

def refresh_access_token():
    global user_access_token, refresh_token_memory

    if not refresh_token_memory:
        print("[WARN] No refresh token found in memory.")
        return False

    print("[TRACE] Attempting to refresh access token...")

    res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token_memory,
            "grant_type": "refresh_token"
        }
    )

    if res.status_code == 200:
        token_data = res.json()
        user_access_token = token_data.get("access_token")
        print("[INFO] Access token refreshed successfully.")
        return True
    else:
        print("[ERROR] Failed to refresh token:", res.text)
        return False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/login")
def login():
    print("[TRACE] Login initiated.")
    return RedirectResponse(
        url=f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={GOOGLE_CLIENT_ID}&"
            f"redirect_uri={REDIRECT_URI}&"
            f"response_type=code&"
            f"scope=https://www.googleapis.com/auth/calendar.readonly&"
            f"access_type=offline&"
            f"prompt=consent"
    )

@app.get("/oauth2callback")
def oauth2callback(request: Request):
    global user_access_token, refresh_token_memory

    print("[TRACE] Received code from Google.")
    code = request.query_params.get("code")
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code"
        }
    )

    token_json = token_res.json()
    user_access_token = token_json.get("access_token")
    refresh_token_memory = token_json.get("refresh_token")

    print("[INFO] New access token obtained.")
    if refresh_token_memory:
        print("[INFO] Refresh token stored in memory.")
    else:
        print("[WARN] No refresh token received from Google.")
    
    return {"status": "Logged in"}

@app.get("/events")
def get_combined_events():
    global user_access_token

    print("[TRACE] /events endpoint called.")

    # Try to ensure we have a valid token
    if not user_access_token:
        print("[WARN] No access token found. Attempting to refresh...")
        if not refresh_access_token():
            return {"error": "No valid token. Please log in."}

    # Time range: from the 1st of the current month to the 1st of the next month
    now = datetime.utcnow().replace(tzinfo=timezone.utc)
    start = now.replace(day=1)
    end = (start + timedelta(days=32)).replace(day=1)
    iso_start = start.isoformat()
    iso_end = end.isoformat()

    calendar_ids = [
        "frg50vhapanlkc10li4sjoqpc4@group.calendar.google.com",  # Brambleberry
        "1175209682ba393df2d49d97b43781dc6331d8cdd9ead63806ebd6a85a26937e@group.calendar.google.com"  # Test calendar
    ]

    all_events = []

    def fetch_calendar_events(cal_id):
        return requests.get(
            f"https://www.googleapis.com/calendar/v3/calendars/{cal_id}/events",
            headers={"Authorization": f"Bearer {user_access_token}"},
            params={
                "timeMin": iso_start,
                "timeMax": iso_end,
                "singleEvents": True,
                "orderBy": "startTime",
                "maxResults": 2500
            }
        )

    for cal_id in calendar_ids:
        print(f"[TRACE] Fetching events from {cal_id}")
        response = fetch_calendar_events(cal_id)

        if response.status_code == 401:
            print(f"[WARN] Access token may be expired. Attempting to refresh...")
            if refresh_access_token():
                response = fetch_calendar_events(cal_id)
            else:
                return {"error": "Token expired and refresh failed. Please log in again."}

        if response.status_code == 200:
            print(f"[INFO] Successfully fetched events from {cal_id}")
            all_events.extend(response.json().get("items", []))
        else:
            print(f"[ERROR] Failed to fetch from {cal_id}: {response.status_code} {response.text}")

    important_events = []
    regular_events = []
    today = datetime.utcnow().date()

    for event in all_events:
        title = event.get("summary", "").lower()
        start = event.get("start", {}).get("dateTime") or event.get("start", {}).get("date")
        try:
            event_date = datetime.fromisoformat(start).date()
        except Exception:
            continue  # Skip if start time is invalid

        if any(phrase in title for phrase in IMPORTANT_PHRASES) and event_date >= today:
            important_events.append(event)

        regular_events.append(event)

    return {
        "important": important_events,
        "regular": regular_events
    }

# Guidely

## What we have so far

- **Backend**: FastAPI app in `guidely/api/main.py`
- **Learners**
  - `POST /api/learners` (create a learner)
  - `GET /api/learners` (list learners)
  - `GET /api/learners/{learner_id}` (get learner + sessions)
  - `PATCH /api/learners/{learner_id}` (rename learner)
- **Sessions**
  - `POST /api/learners/{learner_id}/sessions` (add a session to an existing learner)
    - Payload: `{ "occurred_at": "<ISO datetime (UTC)>", "progress": "progress|same|regression", "description": "<text>" }`
    - Returns: updated learner snapshot (sessions are kept in-memory while the server runs)
- **Frontend**: React (Vite) app in `frontend/` that calls the endpoint and displays the result

## Run the API locally (FastAPI)

Install dependencies (pick one):

- Poetry:
  - `poetry add fastapi "uvicorn[standard]"`
- Pip:
  - `pip install fastapi "uvicorn[standard]"`

Run the server:

- `uvicorn guidely.api.main:app --reload --port 8000`

The API will be available at `http://localhost:8000`.

## Run the Frontend locally (React)

In a separate terminal:

- `cd frontend`
- `npm install`
- `npm run dev`

The frontend will be available at `http://localhost:5173`.

Notes:

- In dev, the frontend uses a Vite proxy (`/api` → `http://localhost:8000`) so you don't need CORS tweaks.
- If you want to call a different backend URL, set `VITE_API_URL` (e.g. `http://localhost:8000/api`).



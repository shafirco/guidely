# Guidely

A personal tutoring management app for private teachers.  
Track learners, record sessions, monitor progress trends, and get alerts when a student needs extra attention.

## Live

| Service  | URL |
|----------|-----|
| Frontend | https://guidely-tzcd.onrender.com |
| Backend  | https://guidely-r7zb.onrender.com |

## Architecture

```
guidely/                    Python package (backend)
├── domain/                 Pure business logic (models, enums, rules, exceptions)
├── application/            Use-cases & port interfaces
│   ├── ports/              Abstract repository contracts
│   └── use_cases/          Application-level orchestration
├── api/                    FastAPI layer
│   ├── routes/             HTTP endpoints
│   ├── schemas/            Pydantic request/response DTOs
│   ├── serializers.py      Domain → JSON helpers
│   └── repositories/       Port implementations (PostgreSQL)
└── infrastructure/         DB engine, ORM models

frontend/                   React (Vite + TypeScript + Tailwind)
├── src/pages/              Page components
├── src/components/         Reusable UI components
└── src/lib/                API client, types, helpers

tests/                      Pytest test suite
```

## API Endpoints

### Learners

| Method   | Path                        | Description           |
|----------|-----------------------------|-----------------------|
| `GET`    | `/api/learners`             | List all learners     |
| `GET`    | `/api/learners/{id}`        | Get learner + sessions|
| `POST`   | `/api/learners`             | Create a learner      |
| `PATCH`  | `/api/learners/{id}`        | Update / rename       |
| `DELETE` | `/api/learners/{id}`        | Delete a learner      |

### Sessions

| Method   | Path                                       | Description        |
|----------|--------------------------------------------|--------------------|
| `POST`   | `/api/learners/{id}/sessions`              | Add a session      |
| `DELETE`  | `/api/learners/{id}/sessions/{session_id}` | Delete a session   |

### Other

| Method | Path      | Description  |
|--------|-----------|--------------|
| `GET`  | `/health` | Health check |

## Run Locally

### Backend (FastAPI)

```bash
# 1. Create & activate a virtual env
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate

# 2. Install dependencies
pip install -e .

# 3. Set the database connection string
#    (copy .env.example → .env and fill in your values)
cp .env.example .env

# 4. Start the server
uvicorn guidely.api.main:app --reload --port 8000
```

The API will be at `http://localhost:8000`.

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be at `http://localhost:5173`.  
In dev, the Vite proxy forwards `/api` requests to `http://localhost:8000`.

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2, psycopg 3, PostgreSQL
- **Frontend**: React 19, TypeScript, Tailwind CSS 4, React Query, React Router, Zod
- **Hosting**: Render (web service + static site + managed PostgreSQL)

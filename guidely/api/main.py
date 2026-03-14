from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from guidely.api.routes import learners, sessions


app = FastAPI(title="Guidely", version="0.1.0")

# CORS (so a separate frontend can call the API from the browser)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Run locally (after installing deps): `uvicorn guidely.api.main:app --reload`
#
# Routers
app.include_router(learners.router)
app.include_router(sessions.router)



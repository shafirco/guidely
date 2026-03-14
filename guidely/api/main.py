from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from guidely.api.routes import learners, sessions, quiz


app = FastAPI(title="Guidely", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learners.router)
app.include_router(sessions.router)
app.include_router(quiz.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

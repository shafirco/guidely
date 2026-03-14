from pydantic import BaseModel, Field


class QuizRequest(BaseModel):
    num_sessions: int = Field(
        default=10,
        ge=1,
        le=50,
        description="How many recent sessions to analyze (default 10).",
    )

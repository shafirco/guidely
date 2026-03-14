from pydantic import BaseModel, Field


class LearnerCreate(BaseModel):
    learner_id: str = Field(..., min_length=1)
    description: str = ""
    important_notes: str = ""


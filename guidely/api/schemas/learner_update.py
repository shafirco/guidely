from pydantic import BaseModel


class LearnerUpdate(BaseModel):
    new_name: str | None = None
    description: str | None = None
    important_notes: str | None = None

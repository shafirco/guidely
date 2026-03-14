from datetime import datetime

from pydantic import BaseModel

from guidely.domain.enums.progress_mark import ProgressMark


class SessionCreate(BaseModel):
    occurred_at: datetime
    progress: ProgressMark
    description: str



from dataclasses import dataclass
from datetime import datetime, timezone

from guidely.domain.enums.progress_mark import ProgressMark
from guidely.domain.exceptions.session import InvalidSessionError, SessionInFutureError


@dataclass(frozen=True)
class Session:
    """
    Represents a single guidance session between a guide and a learner.

    A session captures when it occurred and how the learner progressed
    relative to previous sessions.
    """
    id: str
    occurred_at: datetime
    progress_mark: ProgressMark
    description: str

    def __post_init__(self) -> None:
        self._validate_id()
        self._validate_occurred_at()
        self._validate_description()
    
    def _validate_id(self) -> None:
        if not self.id or not self.id.strip():
            raise InvalidSessionError("Session id cannot be empty.")

    def _validate_occurred_at(self) -> None:
        now = datetime.now(timezone.utc)

        if self.occurred_at.tzinfo is None:
            raise SessionInFutureError(
                "Session datetime must be timezone-aware (UTC)."
            )

        if self.occurred_at > now:
            raise SessionInFutureError(
                "Session cannot be scheduled in the future."
            )

    def _validate_description(self) -> None:
        if not self.description or not self.description.strip():
            raise InvalidSessionError("Session description cannot be empty.")

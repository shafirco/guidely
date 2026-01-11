from dataclasses import dataclass
from datetime import datetime, timezone

from guidely.domain.enums.progress_mark import ProgressMark
from guidely.domain.exceptions.session import SessionInFutureError


@dataclass(frozen=True)
class Session:
    """
    Represents a single guidance session between a guide and a learner.

    A session captures when it occurred and how the learner progressed
    relative to previous sessions.
    """
    occurred_at: datetime
    progress_mark: ProgressMark

    def __post_init__(self) -> None:
        self._validate_occurred_at()

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

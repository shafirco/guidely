from typing import Sequence

from guidely.domain.models.session import Session
from guidely.domain.enums.progress_mark import ProgressMark


def is_not_rising(
    sessions: Sequence[Session],
    lookback: int,
) -> bool:
    """
    Returns True if the learner shows no positive progress
    in the last `lookback` sessions.

    The function assumes sessions are ordered chronologically
    (oldest -> newest).
    """
    if lookback <= 0:
        raise ValueError("lookback must be a positive integer")

    if not sessions:
        return False

    recent_sessions = sessions[-lookback:]

    for session in recent_sessions:
        if session.progress_mark == ProgressMark.PROGRESS:
            return False

    return True

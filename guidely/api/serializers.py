from datetime import datetime

from guidely.domain.enums.progress_mark import ProgressMark
from guidely.domain.models.learner import Learner
from guidely.domain.models.session import Session


def serialize_datetime(dt: datetime) -> str:
    return dt.isoformat()


def serialize_session(session: Session) -> dict:
    return {
        "id": session.id,
        "occurred_at": serialize_datetime(session.occurred_at),
        "progress": session.progress_mark,
        "description": session.description,
    }


def trend_points(sessions_sorted: list[Session], limit: int = 10) -> list[dict]:
    """
    Cumulative chart points for the last *limit* sessions.
    y: progress => +1, same => 0, regression => -1.
    """
    last = sessions_sorted[-limit:]
    points: list[dict] = []
    y = 0
    for i, s in enumerate(last):
        if i > 0:
            if s.progress_mark == ProgressMark.PROGRESS:
                y += 1
            elif s.progress_mark == ProgressMark.REGRESSION:
                y -= 1
        points.append(
            {
                "occurred_at": serialize_datetime(s.occurred_at),
                "progress": s.progress_mark,
                "y": y,
            }
        )
    return points


def serialize_learner(learner: Learner) -> dict:
    sessions_sorted = sorted(learner.sessions, key=lambda s: s.occurred_at)
    return {
        "name": learner.name,
        "description": learner.description,
        "important_notes": learner.important_notes,
        "sessions": [serialize_session(s) for s in sessions_sorted],
        "trend": trend_points(sessions_sorted, limit=10),
    }

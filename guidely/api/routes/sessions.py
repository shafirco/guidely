from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from guidely.api.repositories.store import learner_repository, session_repository
from guidely.api.schemas.session import SessionCreate
from guidely.application.use_cases.add_session import AddSessionUseCase
from guidely.domain.enums.progress_mark import ProgressMark
from guidely.domain.exceptions.base import DomainError
from guidely.domain.models.learner import Learner
from guidely.domain.models.session import Session


router = APIRouter(prefix="/api", tags=["sessions"])

# In-memory stores (shared singletons).
_learner_repository = learner_repository
_session_repository = session_repository


def _serialize_datetime(dt: datetime) -> str:
    return dt.isoformat()


def _serialize_session(session: Session) -> dict:
    return {
        "id": session.id,
        "occurred_at": _serialize_datetime(session.occurred_at),
        "progress": session.progress_mark,
        "description": session.description,
    }


def _serialize_learner(learner: Learner) -> dict:
    sessions_sorted = sorted(learner.sessions, key=lambda s: s.occurred_at)

    # Trend points for the last 10 sessions (for frontend chart).
    last = sessions_sorted[-10:]
    trend: list[dict] = []
    y = 0
    for i, s in enumerate(last):
        if i > 0:
            if s.progress_mark == ProgressMark.PROGRESS:
                y += 1
            elif s.progress_mark == ProgressMark.REGRESSION:
                y -= 1
        trend.append(
            {
                "occurred_at": _serialize_datetime(s.occurred_at),
                "progress": s.progress_mark,
                "y": y,
            }
        )

    return {
        "name": learner.name,
        "description": learner.description,
        "important_notes": learner.important_notes,
        "sessions": [_serialize_session(s) for s in sessions_sorted],
        "trend": trend,
    }


@router.post("/learners/{learner_id}/sessions")
def add_session(learner_id: str, payload: SessionCreate) -> dict:
    """
    Adds a guidance session to an existing learner.

    For now, `learner_id` is treated as the learner name because the domain
    `Learner` doesn't expose an id field.
    """
    use_case = AddSessionUseCase(
        learner_repository=_learner_repository,
        session_repository=_session_repository,
    )

    try:
        session = Session(
            id=str(uuid4()),
            occurred_at=payload.occurred_at,
            progress_mark=payload.progress,
            description=payload.description,
        )
        updated_learner = use_case.execute(learner_id=learner_id, session=session)
    except ValueError as e:
        # Raised by the use case when the learner is not found.
        raise HTTPException(status_code=404, detail=str(e)) from e
    except DomainError as e:
        # Domain-level rule violations (e.g., session in the future).
        raise HTTPException(status_code=400, detail=str(e)) from e

    return {
        "learner_id": learner_id,
        "learner": _serialize_learner(updated_learner),
    }


@router.delete("/learners/{learner_id}/sessions/{session_id}")
def delete_session(learner_id: str, session_id: str) -> dict:
    learner = _learner_repository.get_by_id(learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")

    # Filter session from learner aggregate
    before = len(learner.sessions)
    remaining = tuple(s for s in learner.sessions if s.id != session_id)
    if len(remaining) == before:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    updated = Learner(
        name=learner.name,
        description=learner.description,
        important_notes=learner.important_notes,
        sessions=remaining,
    )

    # Persist: remove from session repository if supported + save learner snapshot
    if hasattr(_session_repository, "delete"):
        _session_repository.delete(learner_id=learner_id, session_id=session_id)  # type: ignore[attr-defined]
    _learner_repository.save(updated)

    return {"learner_id": learner_id, "learner": _serialize_learner(updated)}




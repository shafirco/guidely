from datetime import datetime

from fastapi import APIRouter, HTTPException

from guidely.api.repositories.store import learner_repository, session_repository
from guidely.api.schemas.learner import LearnerCreate
from guidely.api.schemas.learner_update import LearnerRename
from guidely.domain.enums.progress_mark import ProgressMark
from guidely.domain.models.learner import Learner
from guidely.domain.models.session import Session


router = APIRouter(prefix="/api", tags=["learners"])


def _serialize_datetime(dt: datetime) -> str:
    return dt.isoformat()


def _serialize_session(session: Session) -> dict:
    return {
        "id": session.id,
        "occurred_at": _serialize_datetime(session.occurred_at),
        "progress": session.progress_mark,
        "description": session.description,
    }

def _trend_points(sessions_sorted: list[Session], limit: int = 10) -> list[dict]:
    """
    Computes chart points for the last `limit` sessions.

    The y-value is cumulative relative to the previous point:
    - progress => +1
    - same => +0
    - regression => -1
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
                "occurred_at": _serialize_datetime(s.occurred_at),
                "progress": s.progress_mark,
                "y": y,
            }
        )
    return points


def _serialize_learner(learner: Learner) -> dict:
    sessions_sorted = sorted(learner.sessions, key=lambda s: s.occurred_at)
    return {
        "name": learner.name,
        "description": learner.description,
        "important_notes": learner.important_notes,
        "sessions": [_serialize_session(s) for s in sessions_sorted],
        "trend": _trend_points(sessions_sorted, limit=10),
    }


@router.get("/learners")
def list_learners() -> dict:
    learners = learner_repository.list_all()
    return {"learners": [_serialize_learner(l) for l in learners]}


@router.get("/learners/{learner_id}")
def get_learner(learner_id: str) -> dict:
    learner = learner_repository.get_by_id(learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")
    return {"learner_id": learner_id, "learner": _serialize_learner(learner)}


@router.post("/learners")
def create_learner(payload: LearnerCreate) -> dict:
    learner_id = payload.learner_id.strip()
    if learner_repository.get_by_id(learner_id) is not None:
        raise HTTPException(status_code=409, detail=f"Learner '{learner_id}' already exists")

    learner = Learner(
        name=learner_id,
        description=payload.description,
        important_notes=payload.important_notes,
    )
    learner_repository.save(learner)
    return {"learner_id": learner_id, "learner": _serialize_learner(learner)}


@router.patch("/learners/{learner_id}")
def update_learner(learner_id: str, payload: LearnerRename) -> dict:
    learner = learner_repository.get_by_id(learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")

    new_name = payload.new_name.strip() if payload.new_name is not None else learner.name
    if new_name != learner.name and learner_repository.get_by_id(new_name) is not None:
        raise HTTPException(status_code=409, detail=f"Learner '{new_name}' already exists")

    # Domain entities are immutable; create a new one with same sessions.
    updated = Learner(
        name=new_name,
        description=payload.description if payload.description is not None else learner.description,
        important_notes=payload.important_notes if payload.important_notes is not None else learner.important_notes,
        sessions=learner.sessions,
    )

    # Move session storage key and update learner storage (only if name changed).
    learner_repository.save(updated)
    if new_name != learner_id:
        session_repository.move_learner(old_learner_id=learner_id, new_learner_id=new_name)

    # Remove old learner key (since name is the key in-memory).
    # This is safe because we already created the new learner entry.
    from guidely.api.repositories.in_memory import InMemoryLearnerRepository

    if isinstance(learner_repository, InMemoryLearnerRepository):
        if new_name != learner_id:
            learner_repository._by_id.pop(learner_id, None)  # type: ignore[attr-defined]

    return {"learner_id": new_name, "learner": _serialize_learner(updated)}


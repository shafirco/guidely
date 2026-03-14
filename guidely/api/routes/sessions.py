from uuid import uuid4

from fastapi import APIRouter, HTTPException

from guidely.api.repositories.store import learner_repository, session_repository
from guidely.api.schemas.session import SessionCreate
from guidely.api.serializers import serialize_learner
from guidely.application.use_cases.add_session import AddSessionUseCase
from guidely.domain.exceptions.base import DomainError
from guidely.domain.models.learner import Learner
from guidely.domain.models.session import Session


router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/learners/{learner_id}/sessions")
def add_session(learner_id: str, payload: SessionCreate) -> dict:
    use_case = AddSessionUseCase(
        learner_repository=learner_repository,
        session_repository=session_repository,
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
        raise HTTPException(status_code=404, detail=str(e)) from e
    except DomainError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return {"learner_id": learner_id, "learner": serialize_learner(updated_learner)}


@router.delete("/learners/{learner_id}/sessions/{session_id}")
def delete_session(learner_id: str, session_id: str) -> dict:
    learner = learner_repository.get_by_id(learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")

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

    session_repository.delete(learner_id=learner_id, session_id=session_id)
    learner_repository.save(updated)

    return {"learner_id": learner_id, "learner": serialize_learner(updated)}

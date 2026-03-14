from fastapi import APIRouter, HTTPException

from guidely.api.repositories.store import learner_repository
from guidely.api.schemas.learner import LearnerCreate
from guidely.api.schemas.learner_update import LearnerUpdate
from guidely.api.serializers import serialize_learner
from guidely.domain.models.learner import Learner


router = APIRouter(prefix="/api", tags=["learners"])


@router.get("/learners")
def list_learners() -> dict:
    learners = learner_repository.list_all()
    return {"learners": [serialize_learner(l) for l in learners]}


@router.get("/learners/{learner_id}")
def get_learner(learner_id: str) -> dict:
    learner = learner_repository.get_by_id(learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")
    return {"learner_id": learner_id, "learner": serialize_learner(learner)}


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
    return {"learner_id": learner_id, "learner": serialize_learner(learner)}


@router.patch("/learners/{learner_id}")
def update_learner(learner_id: str, payload: LearnerUpdate) -> dict:
    learner = learner_repository.get_by_id(learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")

    new_name = payload.new_name.strip() if payload.new_name is not None else learner.name
    if new_name != learner.name and learner_repository.get_by_id(new_name) is not None:
        raise HTTPException(status_code=409, detail=f"Learner '{new_name}' already exists")

    updated = Learner(
        name=new_name,
        description=payload.description if payload.description is not None else learner.description,
        important_notes=payload.important_notes if payload.important_notes is not None else learner.important_notes,
        sessions=learner.sessions,
    )

    learner_repository.update(learner_id, updated)
    return {"learner_id": new_name, "learner": serialize_learner(updated)}


@router.delete("/learners/{learner_id}")
def delete_learner(learner_id: str) -> dict:
    learner = learner_repository.get_by_id(learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")
    learner_repository.delete(learner_id)
    return {"deleted": learner_id}

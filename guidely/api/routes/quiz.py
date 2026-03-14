from fastapi import APIRouter, HTTPException

from guidely.api.repositories.store import learner_repository
from guidely.api.schemas.quiz import QuizRequest
from guidely.application.services.quiz_generator import QuizGeneratorService
from guidely.domain.models.quiz import Quiz


router = APIRouter(prefix="/api", tags=["quiz"])


def _serialize_quiz(quiz: Quiz) -> dict:
    return {
        "learner_name": quiz.learner_name,
        "summary": quiz.summary,
        "questions": [
            {
                "question_text": q.question_text,
                "topic": q.topic,
                "difficulty": q.difficulty,
                "choices": [
                    {"label": c.label, "text": c.text, "is_correct": c.is_correct}
                    for c in q.choices
                ],
                "explanation": q.explanation,
            }
            for q in quiz.questions
        ],
    }


@router.post("/learners/{learner_id}/quiz")
def generate_quiz(learner_id: str, payload: QuizRequest | None = None) -> dict:
    """
    Generate a personalized multiple-choice quiz for a learner
    based on their recent session history.
    """
    if payload is None:
        payload = QuizRequest()

    learner = learner_repository.get_by_id(learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail=f"Learner '{learner_id}' not found")

    if not learner.sessions:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate quiz: learner has no sessions yet.",
        )

    sessions_to_analyze = sorted(learner.sessions, key=lambda s: s.occurred_at)
    sessions_to_analyze = sessions_to_analyze[-payload.num_sessions:]

    try:
        service = QuizGeneratorService()
        quiz = service.generate(learner_name=learner.name, sessions=sessions_to_analyze)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {str(e)}",
        ) from e

    return {"quiz": _serialize_quiz(quiz)}

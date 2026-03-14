from guidely.domain.models.session import Session
from guidely.domain.models.learner import Learner
from guidely.application.ports.learner_repository import LearnerRepository
from guidely.application.ports.session_repository import SessionRepository


class AddSessionUseCase:
    """
    Application use case for adding a session to an existing learner.
    """

    def __init__(
        self,
        learner_repository: LearnerRepository,
        session_repository: SessionRepository,
    ) -> None:
        self._learner_repository = learner_repository
        self._session_repository = session_repository

    def execute(self, learner_id: str, session: Session) -> Learner:
        learner = self._learner_repository.get_by_id(learner_id)

        if learner is None:
            raise ValueError(f"Learner with id '{learner_id}' not found")

        updated_learner = learner.add_session(session)

        self._session_repository.save(learner_id, session)
        self._learner_repository.save(updated_learner)

        return updated_learner

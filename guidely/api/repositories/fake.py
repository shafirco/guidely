from __future__ import annotations

from typing import Optional, Sequence

from guidely.application.ports.learner_repository import LearnerRepository
from guidely.application.ports.session_repository import SessionRepository
from guidely.domain.models.learner import Learner
from guidely.domain.models.session import Session


class FakeLearnerRepository(LearnerRepository):
    """
    Temporary fake repository for wiring the API to the application layer.

    This always returns a basic Learner instance for any learner_id.
    """

    def get_by_id(self, learner_id: str) -> Optional[Learner]:
        return Learner(name=learner_id)

    def save(self, learner: Learner) -> None:
        # no-op (temporary)
        return None

    def list_all(self) -> Sequence[Learner]:
        return ()


class FakeSessionRepository(SessionRepository):
    """
    Temporary fake repository for wiring the API to the application layer.
    """

    def get_by_learner_id(
        self,
        learner_id: str,
        limit: int | None = None,
    ) -> Sequence[Session]:
        # no-op (temporary)
        return ()

    def save(self, learner_id: str, session: Session) -> None:
        # no-op (temporary)
        return None

    def delete(self, learner_id: str, session_id: str) -> None:
        # no-op (temporary)
        return None



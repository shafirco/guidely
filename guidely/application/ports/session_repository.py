from abc import ABC, abstractmethod
from typing import Sequence

from guidely.domain.models.session import Session


class SessionRepository(ABC):
    """
    Interface for session persistence.
    """

    @abstractmethod
    def get_by_learner_id(
        self,
        learner_id: str,
        limit: int | None = None,
    ) -> Sequence[Session]:
        pass

    @abstractmethod
    def save(self, learner_id: str, session: Session) -> None:
        pass

    @abstractmethod
    def delete(self, learner_id: str, session_id: str) -> None:
        pass

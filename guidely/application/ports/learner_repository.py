from abc import ABC, abstractmethod
from typing import Optional, Sequence

from guidely.domain.models.learner import Learner


class LearnerRepository(ABC):
    """
    Interface for learner persistence.
    """

    @abstractmethod
    def get_by_id(self, learner_id: str) -> Optional[Learner]:
        pass

    @abstractmethod
    def save(self, learner: Learner) -> None:
        pass

    @abstractmethod
    def list_all(self) -> Sequence[Learner]:
        """
        Returns all learners currently in the system.
        """
        pass

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
        pass

    @abstractmethod
    def update(self, learner_id: str, learner: Learner) -> None:
        """
        Updates an existing learner. If the name changed, handles the rename
        atomically (including re-pointing any related sessions).
        """
        pass

    @abstractmethod
    def delete(self, learner_id: str) -> None:
        pass

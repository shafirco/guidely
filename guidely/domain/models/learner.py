from dataclasses import dataclass, field
from typing import Tuple

from guidely.domain.models.session import Session
from guidely.domain.exceptions.learner import EmptyLearnerNameError


@dataclass(frozen=True)
class Learner:
    """
    Represents a learner being guided over time.

    A learner is an immutable entity that accumulates sessions
    describing their progress trajectory.
    """
    name: str
    sessions: Tuple[Session, ...] = field(default_factory=tuple)

    def __post_init__(self) -> None:
        self._validate_name()

    def _validate_name(self) -> None:
        if not self.name or not self.name.strip():
            raise EmptyLearnerNameError("Learner name cannot be empty.")

    def add_session(self, session: Session) -> "Learner":
        """
        Returns a new Learner instance with the given session added.
        """
        return Learner(
            name=self.name,
            sessions=self.sessions + (session,)
        )

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence

from guidely.application.ports.learner_repository import LearnerRepository
from guidely.application.ports.session_repository import SessionRepository
from guidely.domain.models.learner import Learner
from guidely.domain.models.session import Session


@dataclass
class InMemoryLearnerRepository(LearnerRepository):
    """
    Minimal in-memory learner store.

    NOTE: The domain `Learner` currently has no `id` field and the repository
    interface `save(learner)` doesn't receive an id. For now, we treat the
    learner's name as its identifier and expect `learner_id == learner.name`.
    """

    _by_id: Dict[str, Learner] = field(default_factory=dict)

    def get_by_id(self, learner_id: str) -> Optional[Learner]:
        return self._by_id.get(learner_id)

    def save(self, learner: Learner) -> None:
        self._by_id[learner.name] = learner

    def list_all(self) -> Sequence[Learner]:
        # Stable order for UI: alphabetical by name
        return tuple(sorted(self._by_id.values(), key=lambda l: l.name.lower()))


@dataclass
class InMemorySessionRepository(SessionRepository):
    """
    Minimal in-memory session store.
    """

    _by_learner_id: Dict[str, List[Session]] = field(default_factory=dict)

    def get_by_learner_id(
        self,
        learner_id: str,
        limit: int | None = None,
    ) -> Sequence[Session]:
        sessions = self._by_learner_id.get(learner_id, [])
        if limit is None:
            return tuple(sessions)
        return tuple(sessions[-limit:])

    def save(self, learner_id: str, session: Session) -> None:
        self._by_learner_id.setdefault(learner_id, []).append(session)

    def delete(self, learner_id: str, session_id: str) -> None:
        sessions = self._by_learner_id.get(learner_id, [])
        self._by_learner_id[learner_id] = [s for s in sessions if s.id != session_id]

    def move_learner(self, old_learner_id: str, new_learner_id: str) -> None:
        """
        Moves sessions from old learner id to new learner id.

        NOTE: This is an in-memory convenience method used by the API when
        renaming learners (since the domain has no separate immutable id yet).
        """
        if old_learner_id == new_learner_id:
            return
        sessions = self._by_learner_id.pop(old_learner_id, [])
        if sessions:
            self._by_learner_id.setdefault(new_learner_id, []).extend(sessions)



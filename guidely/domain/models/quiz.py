from __future__ import annotations

from dataclasses import dataclass, field
from typing import Tuple


@dataclass(frozen=True)
class Choice:
    """A single answer option in a multiple-choice question."""
    label: str
    text: str
    is_correct: bool


@dataclass(frozen=True)
class Question:
    """
    A multiple-choice question targeting a weak topic.

    The question is designed so the learner solves it on paper first,
    then selects the matching answer.
    """
    question_text: str
    choices: Tuple[Choice, ...]
    explanation: str
    difficulty: str  # "medium" | "hard"
    topic: str

    def correct_label(self) -> str:
        for c in self.choices:
            if c.is_correct:
                return c.label
        return ""


@dataclass(frozen=True)
class Quiz:
    """
    A generated quiz for a specific learner, based on their session history.

    Contains 10-15 multiple-choice questions focused on weak areas.
    """
    learner_name: str
    questions: Tuple[Question, ...] = field(default_factory=tuple)
    summary: str = ""

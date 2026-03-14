"""
Quiz generation service powered by LangChain + OpenAI.

Analyzes a learner's session history and generates a personalized
multiple-choice quiz targeting their weak areas.
"""
from __future__ import annotations

import json
import os
from typing import Sequence

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

from guidely.domain.enums.progress_mark import ProgressMark
from guidely.domain.models.quiz import Choice, Question, Quiz
from guidely.domain.models.session import Session


SYSTEM_PROMPT = """\
You are an expert tutor assistant. Your job is to analyze a student's lesson \
history and generate a personalized multiple-choice quiz that targets their \
weak areas.

You will receive:
1. The student's name
2. A list of recent lessons with: date, progress status (progress/same/regression), \
and a description of what was covered.

Your task:
- Identify the topics where the student is weakest (sessions marked "regression" \
or "same" are more important).
- Generate between 10 and 15 multiple-choice questions.
- Each question should be challenging enough that the student needs to solve it \
on paper before selecting an answer.
- Questions can be "medium" or "hard" difficulty.
- Each question has exactly 4 choices labeled A, B, C, D.
- Exactly one choice is correct.
- Provide a short explanation for the correct answer.
- Write everything in Hebrew.

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{{
  "summary": "<brief Hebrew summary of the student's weak areas>",
  "questions": [
    {{
      "question_text": "<the question in Hebrew>",
      "topic": "<topic name in Hebrew>",
      "difficulty": "medium" | "hard",
      "choices": [
        {{"label": "A", "text": "<choice text>", "is_correct": false}},
        {{"label": "B", "text": "<choice text>", "is_correct": true}},
        {{"label": "C", "text": "<choice text>", "is_correct": false}},
        {{"label": "D", "text": "<choice text>", "is_correct": false}}
      ],
      "explanation": "<short Hebrew explanation>"
    }}
  ]
}}
"""

USER_PROMPT = """\
Student name: {learner_name}

Recent lessons:
{sessions_text}

Generate a personalized quiz for this student.
"""


def _format_sessions(sessions: Sequence[Session]) -> str:
    lines: list[str] = []
    for s in sessions:
        progress_label = {
            ProgressMark.PROGRESS: "התקדמות",
            ProgressMark.SAME: "ללא שינוי",
            ProgressMark.REGRESSION: "נסיגה",
        }.get(s.progress_mark, s.progress_mark)

        lines.append(
            f"- [{s.occurred_at.strftime('%Y-%m-%d')}] "
            f"סטטוס: {progress_label} | "
            f"תיאור: {s.description}"
        )
    return "\n".join(lines)


def _parse_quiz_response(learner_name: str, raw: str) -> Quiz:
    """Parse the LLM JSON response into domain Quiz object."""
    data = json.loads(raw)

    questions: list[Question] = []
    for q in data["questions"]:
        choices = tuple(
            Choice(
                label=c["label"],
                text=c["text"],
                is_correct=bool(c["is_correct"]),
            )
            for c in q["choices"]
        )
        questions.append(
            Question(
                question_text=q["question_text"],
                choices=choices,
                explanation=q["explanation"],
                difficulty=q["difficulty"],
                topic=q.get("topic", ""),
            )
        )

    return Quiz(
        learner_name=learner_name,
        questions=tuple(questions),
        summary=data.get("summary", ""),
    )


class QuizGeneratorService:
    """
    Generates a quiz for a learner using their session history.

    Uses LangChain ChatOpenAI under the hood. Requires OPENAI_API_KEY
    environment variable to be set.
    """

    def __init__(self, model_name: str = "gpt-4o-mini", temperature: float = 0.7) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable is not set")

        self._llm = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=api_key,
        )
        self._prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("human", USER_PROMPT),
        ])

    def generate(self, learner_name: str, sessions: Sequence[Session]) -> Quiz:
        if not sessions:
            return Quiz(
                learner_name=learner_name,
                summary="אין שיעורים זמינים ליצירת מבחן.",
            )

        sorted_sessions = sorted(sessions, key=lambda s: s.occurred_at)

        chain = self._prompt | self._llm
        response = chain.invoke({
            "learner_name": learner_name,
            "sessions_text": _format_sessions(sorted_sessions),
        })

        return _parse_quiz_response(learner_name, response.content)

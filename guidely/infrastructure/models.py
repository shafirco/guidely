from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from guidely.domain.enums.progress_mark import ProgressMark
from guidely.infrastructure.db import Base


class LearnerRow(Base):
    __tablename__ = "learners"

    # We treat learner name as identifier, matching the domain model.
    name: Mapped[str] = mapped_column(String(255), primary_key=True)
    description: Mapped[str] = mapped_column(Text, default="")
    important_notes: Mapped[str] = mapped_column(Text, default="")

    sessions: Mapped[list["SessionRow"]] = relationship(
        back_populates="learner",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class SessionRow(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    learner_name: Mapped[str] = mapped_column(
        String(255), ForeignKey("learners.name", ondelete="CASCADE"), index=True
    )
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    progress_mark: Mapped[ProgressMark] = mapped_column(
        Enum(ProgressMark, name="progress_mark_enum")
    )
    description: Mapped[str] = mapped_column(Text)

    learner: Mapped[LearnerRow] = relationship(back_populates="sessions")


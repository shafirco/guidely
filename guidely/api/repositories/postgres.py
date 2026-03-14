from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import select, update

from guidely.application.ports.learner_repository import LearnerRepository
from guidely.application.ports.session_repository import SessionRepository
from guidely.domain.models.learner import Learner
from guidely.domain.models.session import Session
from guidely.infrastructure.db import SessionLocal, Base, engine
from guidely.infrastructure.models import LearnerRow, SessionRow


Base.metadata.create_all(bind=engine)


def _row_to_domain_session(row: SessionRow) -> Session:
    return Session(
        id=row.id,
        occurred_at=row.occurred_at,
        progress_mark=row.progress_mark,
        description=row.description,
    )


def _row_to_domain_learner(row: LearnerRow) -> Learner:
    ordered = sorted(row.sessions, key=lambda s: s.occurred_at)
    sessions = tuple(_row_to_domain_session(s) for s in ordered)
    return Learner(
        name=row.name,
        description=row.description,
        important_notes=row.important_notes,
        sessions=sessions,
    )


class PostgresLearnerRepository(LearnerRepository):
    def get_by_id(self, learner_id: str) -> Optional[Learner]:
        with SessionLocal() as db:
            row = db.get(LearnerRow, learner_id)
            if row is None:
                return None
            return _row_to_domain_learner(row)

    def save(self, learner: Learner) -> None:
        with SessionLocal() as db:
            row = db.get(LearnerRow, learner.name)
            if row is None:
                row = LearnerRow(
                    name=learner.name,
                    description=learner.description,
                    important_notes=learner.important_notes,
                )
                db.add(row)
            else:
                row.description = learner.description
                row.important_notes = learner.important_notes
            db.commit()

    def list_all(self) -> Sequence[Learner]:
        with SessionLocal() as db:
            stmt = select(LearnerRow).order_by(LearnerRow.name.asc())
            rows = db.scalars(stmt).unique().all()
            return tuple(_row_to_domain_learner(r) for r in rows)

    def update(self, learner_id: str, learner: Learner) -> None:
        with SessionLocal() as db:
            if learner_id != learner.name:
                new_row = LearnerRow(
                    name=learner.name,
                    description=learner.description,
                    important_notes=learner.important_notes,
                )
                db.add(new_row)
                db.flush()

                db.execute(
                    update(SessionRow)
                    .where(SessionRow.learner_name == learner_id)
                    .values(learner_name=learner.name)
                )

                old_row = db.get(LearnerRow, learner_id)
                if old_row is not None:
                    db.delete(old_row)
            else:
                row = db.get(LearnerRow, learner_id)
                if row is not None:
                    row.description = learner.description
                    row.important_notes = learner.important_notes

            db.commit()

    def delete(self, learner_id: str) -> None:
        with SessionLocal() as db:
            row = db.get(LearnerRow, learner_id)
            if row is not None:
                db.delete(row)
                db.commit()


class PostgresSessionRepository(SessionRepository):
    def get_by_learner_id(
        self,
        learner_id: str,
        limit: int | None = None,
    ) -> Sequence[Session]:
        with SessionLocal() as db:
            stmt = (
                select(SessionRow)
                .where(SessionRow.learner_name == learner_id)
                .order_by(SessionRow.occurred_at.asc())
            )
            if limit is not None:
                stmt = stmt.limit(limit)
            rows = db.scalars(stmt).all()
            return tuple(_row_to_domain_session(r) for r in rows)

    def save(self, learner_id: str, session: Session) -> None:
        with SessionLocal() as db:
            learner_row = db.get(LearnerRow, learner_id)
            if learner_row is None:
                learner_row = LearnerRow(name=learner_id, description="", important_notes="")
                db.add(learner_row)

            db_session = SessionRow(
                id=session.id,
                learner_name=learner_id,
                occurred_at=session.occurred_at,
                progress_mark=session.progress_mark,
                description=session.description,
            )
            db.add(db_session)
            db.commit()

    def delete(self, learner_id: str, session_id: str) -> None:
        with SessionLocal() as db:
            db_session = db.get(SessionRow, session_id)
            if db_session is None:
                return
            db.delete(db_session)
            db.commit()


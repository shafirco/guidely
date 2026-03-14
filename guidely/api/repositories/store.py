from guidely.api.repositories.postgres import (
    PostgresLearnerRepository,
    PostgresSessionRepository,
)

# Module-level singletons so all routers share the same DB-backed repositories.
learner_repository = PostgresLearnerRepository()
session_repository = PostgresSessionRepository()


from guidely.api.repositories.in_memory import (
    InMemoryLearnerRepository,
    InMemorySessionRepository,
)

# Module-level singletons so all routers share the same in-memory state.
learner_repository = InMemoryLearnerRepository()
session_repository = InMemorySessionRepository()


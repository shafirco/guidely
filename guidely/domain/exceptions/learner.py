from guidely.domain.exceptions.base import DomainError


class LearnerError(DomainError):
    """Base class for all learner-related domain errors."""
    pass


class InvalidLearnerError(LearnerError):
    """Raised when a learner violates business rules."""
    pass


class EmptyLearnerNameError(InvalidLearnerError):
    """Raised when a learner is created with an empty name."""
    pass

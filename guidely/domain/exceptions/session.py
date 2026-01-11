from guidely.domain.exceptions.base import DomainError


class SessionError(DomainError):
    """Base class for all session-related domain errors."""
    pass


class InvalidSessionError(SessionError):
    """Raised when a session violates business rules."""
    pass


class SessionInFutureError(InvalidSessionError):
    """Raised when a session date is set in the future."""
    pass

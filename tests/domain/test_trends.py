from datetime import datetime, timedelta, timezone

import pytest

from guidely.domain.models.session import Session
from guidely.domain.enums.progress_mark import ProgressMark
from guidely.domain.rules.trends import is_not_rising


def _session(progress: ProgressMark, days_ago: int) -> Session:
    return Session(
        occurred_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
        progress_mark=progress,
    )


def test_returns_false_when_there_are_no_sessions():
    assert is_not_rising([], lookback=3) is False


def test_returns_false_when_there_is_progress_in_lookback():
    sessions = (
        _session(ProgressMark.SAME, 3),
        _session(ProgressMark.PROGRESS, 2),
        _session(ProgressMark.REGRESSION, 1),
    )

    assert is_not_rising(sessions, lookback=3) is False


def test_returns_true_when_all_recent_sessions_are_not_progress():
    sessions = (
        _session(ProgressMark.SAME, 3),
        _session(ProgressMark.REGRESSION, 2),
        _session(ProgressMark.SAME, 1),
    )

    assert is_not_rising(sessions, lookback=3) is True


def test_looks_only_at_the_last_lookback_sessions():
    sessions = (
        _session(ProgressMark.PROGRESS, 4),
        _session(ProgressMark.REGRESSION, 3),
        _session(ProgressMark.REGRESSION, 2),
        _session(ProgressMark.SAME, 1),
    )

    # Only last 3 sessions are considered
    assert is_not_rising(sessions, lookback=3) is True


def test_raises_error_when_lookback_is_not_positive():
    sessions = (_session(ProgressMark.SAME, 1),)

    with pytest.raises(ValueError):
        is_not_rising(sessions, lookback=0)

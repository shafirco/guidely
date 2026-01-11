from enum import Enum


class ProgressMark(str, Enum):
    PROGRESS = "progress"
    SAME = "same"
    REGRESSION = "regression"

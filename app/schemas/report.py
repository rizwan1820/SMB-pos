from enum import Enum


class ReportRange(str, Enum):
    today = "today"
    last_7_days = "last_7_days"
    this_month = "this_month"
    custom = "custom"

from enum import Enum


class ReportRange(str, Enum):
    today = "today"
    yesterday = "yesterday"
    last_7_days = "last_7_days"
    this_week = "this_week"
    this_month = "this_month"
    this_year = "this_year"
    custom = "custom"

"use client"

import { CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  DateRangeState,
  ReportRange,
} from "@/app/(app)/reports/_lib/report-types"

type DateRangeFilterProps = {
  value: DateRangeState
  onChange: (value: DateRangeState) => void
}

const rangeLabels: Array<{ value: ReportRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom" },
]

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  function changeRange(range: ReportRange) {
    onChange({
      ...value,
      range,
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium">Date Range</p>
        <div className="flex flex-wrap gap-2">
          {rangeLabels.map((range) => (
            <Button
              key={range.value}
              type="button"
              variant={value.range === range.value ? "default" : "outline"}
              onClick={() => changeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {value.range === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="report-start-date">Start</Label>
            <Input
              id="report-start-date"
              type="date"
              value={value.startDate}
              onChange={(event) =>
                onChange({ ...value, startDate: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-end-date">End</Label>
            <Input
              id="report-end-date"
              type="date"
              value={value.endDate}
              onChange={(event) =>
                onChange({ ...value, endDate: event.target.value })
              }
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden="true" />
          Backend range is authoritative.
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Banknote,
  ReceiptText,
  RotateCcw,
  TrendingUp,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DateRangeFilter } from "@/app/(app)/reports/_components/date-range-filter"
import { KpiGrid } from "@/app/(app)/reports/_components/kpi-grid"
import {
  formatMoney,
  getDashboardReport,
} from "@/app/(app)/reports/_lib/report-api"
import type {
  DashboardReport,
  DateRangeState,
} from "@/app/(app)/reports/_lib/report-types"

const today = new Date().toISOString().slice(0, 10)

export default function DashboardPage() {
  const [rangeState, setRangeState] = useState<DateRangeState>({
    range: "today",
    startDate: today,
    endDate: today,
  })
  const [report, setReport] = useState<DashboardReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (
        rangeState.range === "custom" &&
        (!rangeState.startDate || !rangeState.endDate)
      ) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        const data = await getDashboardReport(rangeState)

        if (active) {
          setReport(data)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [rangeState])

  const metricCards = useMemo(
    () => [
      {
        title: "Total Sales",
        value: report ? formatMoney(report.total_sales) : "$0.00",
        description: "Completed orders",
        icon: Banknote,
      },
      {
        title: "Order Count",
        value: report ? String(report.order_count) : "0",
        description: "Completed orders",
        icon: ReceiptText,
      },
      {
        title: "Total Refunds",
        value: report ? formatMoney(report.total_refunds) : "$0.00",
        description: "Completed refunds",
        icon: RotateCcw,
      },
      {
        title: "Net Sales",
        value: report ? formatMoney(report.net_sales) : "$0.00",
        description: "Sales less refunds",
        icon: TrendingUp,
      },
      {
        title: "Low Stock Count",
        value: report ? String(report.low_stock_count) : "0",
        description: "Products needing attention",
        icon: AlertTriangle,
      },
    ],
    [report]
  )

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review sales, refunds, and inventory signals from backend reports.
        </p>
      </div>

      <DateRangeFilter value={rangeState} onChange={setRangeState} />

      {error ? (
        <Card className="rounded-lg border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>Dashboard unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <KpiGrid cards={metricCards} loading={loading} />
    </main>
  )
}

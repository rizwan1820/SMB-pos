"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Banknote,
  Boxes,
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
import type { DateRangeState } from "@/app/(app)/reports/_lib/report-types"

const today = new Date().toISOString().slice(0, 10)

export default function DashboardPage() {
  const [rangeState, setRangeState] = useState<DateRangeState>({
    range: "today",
    startDate: today,
    endDate: today,
  })
  const hasValidRange =
    rangeState.range !== "custom" ||
    Boolean(rangeState.startDate && rangeState.endDate)
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", rangeState],
    queryFn: () => getDashboardReport(rangeState),
    enabled: hasValidRange,
  })
  const report = dashboardQuery.data ?? null
  const error =
    dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null

  const metricCards = useMemo(
    () => [
      {
        title: "Total Sales",
        value: report ? formatMoney(report.total_sales) : "$0.00",
        description: "Completed orders",
        icon: Banknote,
      },
      {
        title: "Orders",
        value: report ? String(report.order_count) : "0",
        description: "Completed orders",
        icon: ReceiptText,
      },
      {
        title: "Products Sold",
        value: report ? String(report.products_sold) : "0",
        description: "Completed order items",
        icon: Boxes,
      },
      {
        title: "Returns/Refunds",
        value: report ? formatMoney(report.total_refunds) : "$0.00",
        description: "Completed refunds",
        icon: RotateCcw,
      },
      {
        title: "Average Order Value",
        value: report ? formatMoney(report.average_order_value) : "$0.00",
        description: "Sales divided by orders",
        icon: TrendingUp,
      },
      {
        title: "Low Stock",
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

      <KpiGrid cards={metricCards} loading={dashboardQuery.isLoading} />
    </main>
  )
}

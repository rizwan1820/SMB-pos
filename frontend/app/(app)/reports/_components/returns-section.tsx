"use client"

import { RotateCcw, WalletCards } from "lucide-react"

import {
  formatDate,
  formatMoney,
} from "@/app/(app)/reports/_lib/report-api"
import type { ReturnsReport } from "@/app/(app)/reports/_lib/report-types"
import { KpiGrid } from "@/app/(app)/reports/_components/kpi-grid"
import { ReportTable } from "@/app/(app)/reports/_components/report-table"

type ReturnsSectionProps = {
  report: ReturnsReport
}

export function ReturnsSection({ report }: ReturnsSectionProps) {
  return (
    <div className="grid gap-4">
      <KpiGrid
        cards={[
          {
            title: "Refund Total",
            value: formatMoney(report.refund_total),
            description: "Completed refunds",
            icon: WalletCards,
          },
          {
            title: "Return Count",
            value: String(report.return_count),
            description: "Completed returns",
            icon: RotateCcw,
          },
        ]}
      />

      <ReportTable
        title="Daily Returns"
        description="Completed return and refund totals by day."
        rows={report.daily}
        emptyText="No returns found for this range."
        columns={[
          { header: "Date", cell: (row) => formatDate(row.date) },
          {
            header: "Returns",
            className: "text-right tabular-nums",
            cell: (row) => row.return_count,
          },
          {
            header: "Refunds",
            className: "text-right tabular-nums",
            cell: (row) => formatMoney(row.refund_total),
          },
        ]}
      />
    </div>
  )
}

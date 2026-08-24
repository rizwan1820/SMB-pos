"use client"

import {
  formatDate,
  formatDateTime,
  formatMoney,
  shortId,
} from "@/app/(app)/reports/_lib/report-api"
import type { SalesReport } from "@/app/(app)/reports/_lib/report-types"
import { ReportTable } from "@/app/(app)/reports/_components/report-table"

type SalesSectionProps = {
  report: SalesReport
}

export function SalesSection({ report }: SalesSectionProps) {
  return (
    <div className="grid gap-4">
      <ReportTable
        title="Sales Over Time"
        description="Completed order totals grouped by day."
        rows={report.sales_over_time}
        emptyText="No sales found for this range."
        columns={[
          {
            header: "Date",
            cell: (row) => formatDate(row.date),
          },
          {
            header: "Orders",
            className: "text-right tabular-nums",
            cell: (row) => row.order_count,
          },
          {
            header: "Total Sales",
            className: "text-right tabular-nums",
            cell: (row) => formatMoney(row.total_sales),
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportTable
          title="Payment Methods"
          description="Completed payment totals by tender type."
          rows={report.payment_methods}
          emptyText="No payments found for this range."
          columns={[
            {
              header: "Method",
              cell: (row) => (
                <span className="capitalize">{row.method}</span>
              ),
            },
            {
              header: "Count",
              className: "text-right tabular-nums",
              cell: (row) => row.count,
            },
            {
              header: "Amount",
              className: "text-right tabular-nums",
              cell: (row) => formatMoney(row.amount),
            },
          ]}
        />

        <ReportTable
          title="Order Totals"
          description="Completed order totals in the selected range."
          rows={report.order_totals}
          emptyText="No orders found for this range."
          columns={[
            {
              header: "Order",
              cell: (row) => `#${shortId(row.order_id)}`,
            },
            {
              header: "Created",
              cell: (row) => formatDateTime(row.created_at),
            },
            {
              header: "Status",
              cell: (row) => (
                <span className="capitalize">{row.status}</span>
              ),
            },
            {
              header: "Total",
              className: "text-right tabular-nums",
              cell: (row) => formatMoney(row.total_amount),
            },
          ]}
        />
      </div>
    </div>
  )
}

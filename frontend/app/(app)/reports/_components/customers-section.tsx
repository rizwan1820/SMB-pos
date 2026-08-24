"use client"

import { formatMoney } from "@/app/(app)/reports/_lib/report-api"
import type { CustomersReport } from "@/app/(app)/reports/_lib/report-types"
import { ReportTable } from "@/app/(app)/reports/_components/report-table"

type CustomersSectionProps = {
  report: CustomersReport
}

export function CustomersSection({ report }: CustomersSectionProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ReportTable
        title="Top Customers by Spend"
        description="Named customers ranked by completed order totals."
        rows={report.top_customers_by_spend}
        emptyText="No named customer spend found for this range."
        columns={[
          { header: "Customer", cell: (row) => row.name },
          {
            header: "Spend",
            className: "text-right tabular-nums",
            cell: (row) => formatMoney(row.spend),
          },
        ]}
      />

      <ReportTable
        title="Order Count per Customer"
        description="Named customers ranked by completed order count."
        rows={report.customer_order_counts}
        emptyText="No named customer orders found for this range."
        columns={[
          { header: "Customer", cell: (row) => row.name },
          {
            header: "Orders",
            className: "text-right tabular-nums",
            cell: (row) => row.order_count,
          },
        ]}
      />
    </div>
  )
}

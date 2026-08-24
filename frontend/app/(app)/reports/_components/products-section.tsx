"use client"

import {
  formatMoney,
  formatQuantity,
} from "@/app/(app)/reports/_lib/report-api"
import type { ProductsReport } from "@/app/(app)/reports/_lib/report-types"
import { ReportTable } from "@/app/(app)/reports/_components/report-table"

type ProductsSectionProps = {
  report: ProductsReport
}

export function ProductsSection({ report }: ProductsSectionProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <ReportTable
          title="Top Products by Quantity"
          description="Historical order item quantities from completed orders."
          rows={report.top_by_quantity}
          emptyText="No product sales found for this range."
          columns={[
            { header: "Product", cell: (row) => row.name },
            { header: "SKU", cell: (row) => row.sku },
            {
              header: "Quantity",
              className: "text-right tabular-nums",
              cell: (row) => formatQuantity(row.quantity),
            },
          ]}
        />

        <ReportTable
          title="Top Products by Revenue"
          description="Historical order item line totals from completed orders."
          rows={report.top_by_revenue}
          emptyText="No product revenue found for this range."
          columns={[
            { header: "Product", cell: (row) => row.name },
            { header: "SKU", cell: (row) => row.sku },
            {
              header: "Revenue",
              className: "text-right tabular-nums",
              cell: (row) => formatMoney(row.revenue),
            },
          ]}
        />
      </div>

      <ReportTable
        title="Low-Stock Products"
        description="Current movement-based stock at or below threshold."
        rows={report.low_stock_products}
        emptyText="No low-stock products right now."
        columns={[
          { header: "Product", cell: (row) => row.name },
          { header: "SKU", cell: (row) => row.sku },
          {
            header: "Current Stock",
            className: "text-right tabular-nums",
            cell: (row) => formatQuantity(row.current_stock),
          },
          {
            header: "Threshold",
            className: "text-right tabular-nums",
            cell: (row) => row.low_stock_threshold,
          },
        ]}
      />
    </div>
  )
}

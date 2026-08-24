"use client"

import {
  formatDateTime,
  formatMoney,
  formatQuantity,
} from "@/app/(app)/reports/_lib/report-api"
import type { InventoryReport } from "@/app/(app)/reports/_lib/report-types"
import { ReportTable } from "@/app/(app)/reports/_components/report-table"

type InventorySectionProps = {
  report: InventoryReport
}

function movementLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) =>
    match.toUpperCase()
  )
}

export function InventorySection({ report }: InventorySectionProps) {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Total Inventory Value</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {formatMoney(report.inventory_value.total_inventory_value)}
        </p>
      </div>

      <ReportTable
        title="Current Inventory Status"
        description="Movement-based current stock for active products."
        rows={report.current_inventory}
        emptyText="No active products found."
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
          { header: "Status", cell: (row) => row.status },
        ]}
      />

      <ReportTable
        title="Basic Inventory Value"
        description="Current stock multiplied by current product cost price."
        rows={report.inventory_value.items}
        emptyText="No inventory value rows found."
        columns={[
          { header: "Product", cell: (row) => row.name },
          { header: "SKU", cell: (row) => row.sku },
          {
            header: "Stock",
            className: "text-right tabular-nums",
            cell: (row) => formatQuantity(row.current_stock),
          },
          {
            header: "Cost",
            className: "text-right tabular-nums",
            cell: (row) => formatMoney(row.cost_price),
          },
          {
            header: "Value",
            className: "text-right tabular-nums",
            cell: (row) => formatMoney(row.inventory_value),
          },
        ]}
      />

      <ReportTable
        title="Inventory Movement History"
        description="Newest movement ledger entries."
        rows={report.movement_history}
        emptyText="No inventory movements found."
        columns={[
          { header: "Date", cell: (row) => formatDateTime(row.date) },
          { header: "Product", cell: (row) => row.product_name },
          { header: "SKU", cell: (row) => row.sku },
          { header: "Type", cell: (row) => movementLabel(row.movement_type) },
          {
            header: "Quantity",
            className: "text-right tabular-nums",
            cell: (row) => formatQuantity(row.quantity),
          },
          { header: "Reference", cell: (row) => row.reference ?? "-" },
          { header: "Notes", cell: (row) => row.notes ?? "-" },
        ]}
      />
    </div>
  )
}

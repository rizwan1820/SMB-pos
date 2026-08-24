"use client"

import { Loader2 } from "lucide-react"

import {
  formatDateTime,
  formatQuantity,
} from "@/app/(app)/inventory/_lib/inventory-api"
import { InventoryMovement } from "@/app/(app)/inventory/_lib/inventory-types"

type MovementHistoryTableProps = {
  movements: InventoryMovement[]
  loading: boolean
  hasSelectedProduct: boolean
}

const movementLabels: Record<string, string> = {
  opening: "Opening Stock",
  received: "Received",
  receive: "Received",
  sale: "Sale",
  return: "Return",
  adjustment: "Adjustment",
  adjustment_in: "Adjustment In",
  adjustment_out: "Adjustment Out",
  damaged: "Damaged",
  lost: "Lost",
}

function movementLabel(type: string) {
  return movementLabels[type] ?? type.replace(/_/g, " ")
}

export function MovementHistoryTable({
  movements,
  loading,
  hasSelectedProduct,
}: MovementHistoryTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading movements...
                  </span>
                </td>
              </tr>
            ) : !hasSelectedProduct ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Select a product to view movement history.
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No movements recorded for this product.
                </td>
              </tr>
            ) : (
              movements.map((movement, index) => (
                <tr key={`${movement.created_at}-${index}`} className="bg-card">
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                      {movementLabel(movement.movement_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatQuantity(movement.quantity)}
                  </td>
                  <td className="px-4 py-3">{movement.reference ?? "-"}</td>
                  <td className="px-4 py-3">{movement.notes ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(movement.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

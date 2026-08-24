"use client"

import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  formatDateTime,
  formatMoney,
  shortId,
  toNumber,
} from "@/app/(app)/returns/_lib/return-api"
import type {
  OrderDetail,
  OrderSummary,
  ReturnFormItem,
} from "@/app/(app)/returns/_lib/return-types"

type ReturnCreatePanelProps = {
  orders: OrderSummary[]
  order: OrderDetail | null
  productNameById: Map<string, string>
  selectedOrderId: string
  formItems: ReturnFormItem[]
  returnedQuantityByOrderItemId: Map<string, number>
  reason: string
  restock: boolean
  refundMethod: "cash" | "card" | "other"
  refundReference: string
  loadingOrder: boolean
  submitting: boolean
  onOrderChange: (orderId: string) => void
  onToggleItem: (orderItemId: string, selected: boolean) => void
  onQuantityChange: (orderItemId: string, quantity: string) => void
  onReasonChange: (reason: string) => void
  onRestockChange: (restock: boolean) => void
  onRefundMethodChange: (method: "cash" | "card" | "other") => void
  onRefundReferenceChange: (reference: string) => void
  onSubmit: () => void
}

export function ReturnCreatePanel({
  orders,
  order,
  productNameById,
  selectedOrderId,
  formItems,
  returnedQuantityByOrderItemId,
  reason,
  restock,
  refundMethod,
  refundReference,
  loadingOrder,
  submitting,
  onOrderChange,
  onToggleItem,
  onQuantityChange,
  onReasonChange,
  onRestockChange,
  onRefundMethodChange,
  onRefundReferenceChange,
  onSubmit,
}: ReturnCreatePanelProps) {
  const formItemById = new Map(
    formItems.map((item) => [item.order_item_id, item])
  )
  const selectedCount = formItems.filter((item) => item.selected).length

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-2">
          <Label htmlFor="return-order">Completed order</Label>
          <select
            id="return-order"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={selectedOrderId}
            onChange={(event) => onOrderChange(event.target.value)}
          >
            <option value="">Select an order</option>
            {orders
              .filter((orderSummary) => orderSummary.status === "completed")
              .map((orderSummary) => (
                <option key={orderSummary.id} value={orderSummary.id}>
                  #{shortId(orderSummary.id)} ·{" "}
                  {formatMoney(orderSummary.total_amount)} ·{" "}
                  {formatDateTime(orderSummary.created_at)}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="restock">Restock</Label>
          <select
            id="restock"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={restock ? "yes" : "no"}
            onChange={(event) => onRestockChange(event.target.value === "yes")}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {loadingOrder ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Loading order detail...
        </div>
      ) : null}

      {order && !loadingOrder ? (
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Order #{shortId(order.id)}</p>
            <p className="mt-1 text-muted-foreground">
              {formatDateTime(order.created_at)} ·{" "}
              {formatMoney(order.total_amount)}
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Return</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Purchased
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Returned
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Remaining
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item) => {
                    const formItem = formItemById.get(item.id)
                    const purchased = toNumber(item.quantity)
                    const returned =
                      returnedQuantityByOrderItemId.get(item.id) ?? 0
                    const remaining = Math.max(purchased - returned, 0)

                    return (
                      <tr key={item.id} className="bg-card">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={formItem?.selected ?? false}
                            disabled={remaining <= 0}
                            onChange={(event) =>
                              onToggleItem(item.id, event.target.checked)
                            }
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {productNameById.get(item.product_id) ?? "Product"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {returned}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {remaining}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Input
                            className="ml-auto w-28 text-right"
                            min="0"
                            max={remaining}
                            step="0.001"
                            type="number"
                            value={formItem?.quantity ?? ""}
                            disabled={!formItem?.selected || remaining <= 0}
                            onChange={(event) =>
                              onQuantityChange(item.id, event.target.value)
                            }
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="return-reason">Reason</Label>
          <Input
            id="return-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-method">Refund method</Label>
          <select
            id="refund-method"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={refundMethod}
            onChange={(event) =>
              onRefundMethodChange(
                event.target.value as "cash" | "card" | "other"
              )
            }
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="refund-reference">Refund reference</Label>
          <Input
            id="refund-reference"
            value={refundReference}
            onChange={(event) => onRefundReferenceChange(event.target.value)}
          />
        </div>
      </div>

      <Button
        type="button"
        disabled={!order || selectedCount === 0 || submitting}
        onClick={onSubmit}
      >
        <RotateCcw aria-hidden="true" />
        {submitting ? "Processing..." : "Create Return"}
      </Button>
    </div>
  )
}

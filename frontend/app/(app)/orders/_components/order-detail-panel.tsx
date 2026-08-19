"use client"

import { Loader2 } from "lucide-react"

import {
  formatDateTime,
  formatMoney,
  shortOrderId,
} from "@/app/(app)/orders/_lib/order-api"
import type { OrderDetail } from "@/app/(app)/orders/_lib/order-types"

type OrderDetailPanelProps = {
  order: OrderDetail | null
  customerNameById: Map<string, string>
  productNameById: Map<string, string>
  loading: boolean
  error: string | null
}

export function OrderDetailPanel({
  order,
  customerNameById,
  productNameById,
  loading,
  error,
}: OrderDetailPanelProps) {
  if (loading) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Loading order detail...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Select an order to review its items and payment.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Order ID</p>
        <h3 className="mt-1 break-all text-lg font-semibold">
          #{shortOrderId(order.id)}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDateTime(order.created_at)}
        </p>
        <p className="mt-2 text-sm">
          {order.customer_id
            ? customerNameById.get(order.customer_id) ?? "Customer"
            : "Walk-in"}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Unit</th>
                <th className="px-4 py-3 text-right font-medium">Discount</th>
                <th className="px-4 py-3 text-right font-medium">Tax</th>
                <th className="px-4 py-3 text-right font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {order.items.map((item) => (
                <tr key={item.id} className="bg-card">
                  <td className="px-4 py-3">
                    {productNameById.get(item.product_id) ?? "Product"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(item.discount_amount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(item.tax_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatMoney(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order discount</span>
            <span className="tabular-nums">
              {formatMoney(order.discount_amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="tabular-nums">{formatMoney(order.tax_amount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Final total</span>
            <span className="tabular-nums">
              {formatMoney(order.total_amount)}
            </span>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-medium">Payment</p>
          {order.payment ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{order.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="tabular-nums">
                  {formatMoney(order.payment.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{order.payment.status}</span>
              </div>
              {order.payment.reference ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="break-all text-right">
                    {order.payment.reference}
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">No payment recorded.</p>
          )}
        </div>
      </div>
    </div>
  )
}

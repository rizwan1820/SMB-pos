"use client"

import { Loader2 } from "lucide-react"

import {
  formatDateTime,
  formatMoney,
  shortId,
} from "@/app/(app)/returns/_lib/return-api"
import type { ReturnDetail } from "@/app/(app)/returns/_lib/return-types"

type ReturnDetailPanelProps = {
  returnDetail: ReturnDetail | null
  productNameById: Map<string, string>
  loading: boolean
  error: string | null
}

export function ReturnDetailPanel({
  returnDetail,
  productNameById,
  loading,
  error,
}: ReturnDetailPanelProps) {
  if (loading) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Loading return detail...
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

  if (!returnDetail) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Select a return to review refund and item details.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Return</p>
        <h3 className="mt-1 text-lg font-semibold">
          #{shortId(returnDetail.id)}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDateTime(returnDetail.created_at)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-medium">Return Info</p>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Order</span>
            <span>#{shortId(returnDetail.order_id)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Reason</span>
            <span className="text-right">{returnDetail.reason}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Restock</span>
            <span>{returnDetail.restock ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize">{returnDetail.status}</span>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-medium">Refund</p>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Amount</span>
            <span className="tabular-nums">
              {formatMoney(returnDetail.refund.amount)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Method</span>
            <span className="capitalize">{returnDetail.refund.method}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize">{returnDetail.refund.status}</span>
          </div>
          {returnDetail.refund.reference ? (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Reference</span>
              <span className="break-all text-right">
                {returnDetail.refund.reference}
              </span>
            </div>
          ) : null}
        </div>
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
                <th className="px-4 py-3 text-right font-medium">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {returnDetail.items.map((item) => (
                <tr key={item.id} className="bg-card">
                  <td className="px-4 py-3 font-medium">
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
          <p className="font-medium">Original Order</p>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Order</span>
            <span>#{shortId(returnDetail.order.id)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total</span>
            <span>{formatMoney(returnDetail.order.total_amount)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Created</span>
            <span className="text-right">
              {formatDateTime(returnDetail.order.created_at)}
            </span>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-medium">Invoice</p>
          {returnDetail.invoice ? (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Number</span>
                <span>{returnDetail.invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Date</span>
                <span className="text-right">
                  {formatDateTime(returnDetail.invoice.invoice_date)}
                </span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No invoice recorded.</p>
          )}
        </div>
      </div>
    </div>
  )
}

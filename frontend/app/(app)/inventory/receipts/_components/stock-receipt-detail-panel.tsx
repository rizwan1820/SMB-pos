"use client"

import { Loader2, PackageSearch } from "lucide-react"

import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatQuantity,
} from "@/app/(app)/inventory/receipts/_lib/stock-receipt-api"
import type { StockReceiptDetail } from "@/app/(app)/inventory/receipts/_lib/stock-receipt-types"

type StockReceiptDetailPanelProps = {
  receipt: StockReceiptDetail | null
  loading: boolean
  error: string | null
  currency: string
}

export function StockReceiptDetailPanel({
  receipt,
  loading,
  error,
  currency,
}: StockReceiptDetailPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading receipt detail...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
        <PackageSearch className="size-8" aria-hidden="true" />
        Select a receipt to inspect supplier and item details.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Supplier</p>
          <p className="font-medium">{receipt.supplier.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[receipt.supplier.phone, receipt.supplier.email]
              .filter(Boolean)
              .join(" | ") || "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Receipt Date</p>
          <p className="font-medium">{formatDate(receipt.receipt_date)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {formatDateTime(receipt.created_at)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Reference</p>
          <p className="font-medium">{receipt.reference ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="font-medium capitalize">{receipt.status}</p>
        </div>
      </div>

      {receipt.notes ? (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          {receipt.notes}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">SKU</th>
              <th className="px-3 py-3 text-right font-medium">Quantity</th>
              <th className="px-3 py-3 text-right font-medium">Unit Cost</th>
              <th className="px-3 py-3 text-right font-medium">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {receipt.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 font-medium">{item.product_name}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {item.product_sku}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatQuantity(item.quantity)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatMoney(item.unit_cost, currency)}
                </td>
                <td className="px-3 py-3 text-right font-medium tabular-nums">
                  {formatMoney(item.line_total, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Backend-confirmed total
          </p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(receipt.total_cost, currency)}
          </p>
        </div>
      </div>
    </div>
  )
}

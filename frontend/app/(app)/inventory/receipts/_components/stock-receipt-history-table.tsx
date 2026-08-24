"use client"

import { Eye, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/app/(app)/inventory/receipts/_lib/stock-receipt-api"
import type { StockReceiptListItem } from "@/app/(app)/inventory/receipts/_lib/stock-receipt-types"

type StockReceiptHistoryTableProps = {
  receipts: StockReceiptListItem[]
  selectedReceiptId: string | null
  loading: boolean
  currency: string
  onView: (receipt: StockReceiptListItem) => void
}

export function StockReceiptHistoryTable({
  receipts,
  selectedReceiptId,
  loading,
  currency,
  onView,
}: StockReceiptHistoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Receipt Date</th>
            <th className="px-4 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">Reference</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {loading ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading stock receipts...
                </span>
              </td>
            </tr>
          ) : receipts.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                No supplier receipts have been recorded yet.
              </td>
            </tr>
          ) : (
            receipts.map((receipt) => (
              <tr key={receipt.id} className="bg-card">
                <td className="px-4 py-3">{formatDate(receipt.receipt_date)}</td>
                <td className="px-4 py-3 font-medium">
                  {receipt.supplier_name}
                </td>
                <td className="px-4 py-3">{receipt.reference ?? "-"}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatMoney(receipt.total_cost, currency)}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                    {receipt.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(receipt.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant={
                      selectedReceiptId === receipt.id ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() => onView(receipt)}
                  >
                    <Eye aria-hidden="true" />
                    View
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

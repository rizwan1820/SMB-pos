"use client"

import { Loader2 } from "lucide-react"

import {
  formatDateTime,
  formatMoney,
  shortId,
} from "@/app/(app)/returns/_lib/return-api"
import type { ReturnSummary } from "@/app/(app)/returns/_lib/return-types"

type ReturnsHistoryTableProps = {
  returns: ReturnSummary[]
  selectedReturnId: string | null
  loading: boolean
  onSelectReturn: (returnSummary: ReturnSummary) => void
}

export function ReturnsHistoryTable({
  returns,
  selectedReturnId,
  loading,
  onSelectReturn,
}: ReturnsHistoryTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Return</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Restock</th>
              <th className="px-4 py-3 text-right font-medium">Refund</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading returns...
                  </span>
                </td>
              </tr>
            ) : returns.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No returns have been recorded yet.
                </td>
              </tr>
            ) : (
              returns.map((returnSummary) => (
                <tr
                  key={returnSummary.id}
                  className={
                    selectedReturnId === returnSummary.id
                      ? "cursor-pointer bg-muted/60"
                      : "cursor-pointer bg-card hover:bg-muted/40"
                  }
                  onClick={() => onSelectReturn(returnSummary)}
                >
                  <td className="px-4 py-3 font-medium">
                    #{shortId(returnSummary.id)}
                  </td>
                  <td className="px-4 py-3">
                    #{shortId(returnSummary.order_id)}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3">
                    {returnSummary.reason}
                  </td>
                  <td className="px-4 py-3">
                    {returnSummary.restock ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(returnSummary.refund_amount)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {returnSummary.refund_method ?? "-"}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {returnSummary.refund_status ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(returnSummary.created_at)}
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

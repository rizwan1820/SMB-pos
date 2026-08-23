"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import {
  formatDateTime,
  formatMoney,
  shortOrderId,
} from "@/app/(app)/orders/_lib/order-api"
import type { OrderSummary } from "@/app/(app)/orders/_lib/order-types"

type OrdersTableProps = {
  orders: OrderSummary[]
  customerNameById: Map<string, string>
  selectedOrderId: string | null
  loading: boolean
  onSelectOrder: (order: OrderSummary) => void
}

export function OrdersTable({
  orders,
  customerNameById,
  selectedOrderId,
  loading,
  onSelectOrder,
}: OrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading orders...
                  </span>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No orders have been recorded yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className={
                    selectedOrderId === order.id
                      ? "cursor-pointer bg-muted/60"
                      : "cursor-pointer bg-card hover:bg-muted/40"
                  }
                  onClick={() => onSelectOrder(order)}
                >
                  <td className="px-4 py-3 font-medium">
                    <div className="space-y-1">
                      <p>#{shortOrderId(order.id)}</p>
                      {order.invoice ? (
                        <Link
                          href={`/invoices/${order.invoice.id}`}
                          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          View Invoice
                        </Link>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {order.customer_id
                      ? customerNameById.get(order.customer_id) ?? "Customer"
                      : "Walk-in"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(order.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {order.invoice ? (
                      <Link
                        href={`/invoices/${order.invoice.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Invoice
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        -
                      </span>
                    )}
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

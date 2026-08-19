"use client"

import { CheckCircle2 } from "lucide-react"

import { toMoney } from "@/app/(app)/pos/_lib/pos-api"
import type { CheckoutResult } from "@/app/(app)/pos/_lib/pos-types"

type CheckoutSummaryProps = {
  result: CheckoutResult
}

export function CheckoutSummary({ result }: CheckoutSummaryProps) {
  return (
    <div className="rounded-lg border border-green-600/30 bg-green-600/5 p-4 text-sm">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 text-green-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Checkout completed</p>
          <p className="mt-1 break-all text-muted-foreground">
            Order ID: {result.order_id}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="font-medium tabular-nums">
                {toMoney(result.subtotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tax</p>
              <p className="font-medium tabular-nums">
                {toMoney(result.tax_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-medium tabular-nums">
                {toMoney(result.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

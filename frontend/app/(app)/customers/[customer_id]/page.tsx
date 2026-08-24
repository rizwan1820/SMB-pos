"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCustomerProfile } from "@/app/(app)/customers/_lib/customer-api"
import type { CustomerProfile } from "@/app/(app)/customers/_lib/customer-types"
import { getBusinessSettings } from "@/app/(app)/settings/_lib/settings-api"

function formatMoney(value: string | number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value))
}

function formatDate(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date)
}

function label(value: string | null) {
  if (!value) {
    return "-"
  }

  return value.replace(/_/g, " ").replace(/\b\w/g, (match) =>
    match.toUpperCase()
  )
}

export default function CustomerProfilePage() {
  const params = useParams<{ customer_id: string }>()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [currency, setCurrency] = useState("USD")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError(null)

      try {
        const [profileData, settings] = await Promise.all([
          getCustomerProfile(params.customer_id),
          getBusinessSettings(),
        ])

        if (!active) {
          return
        }

        setProfile(profileData)
        setCurrency(settings.currency || "USD")
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load customer profile."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [params.customer_id])

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/customers"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Customers
          </Link>
          <h1 className="text-2xl font-semibold tracking-normal">
            {profile?.customer.name ?? "Customer Profile"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer purchase and return history from stored transactions.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading customer profile...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!loading && profile ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-lg">
              <CardHeader className="border-b">
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                  Basic CRM details for this customer.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {profile.customer.customer_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">
                    {profile.customer.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.customer.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.customer.email ?? "-"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {profile.customer.address ?? "-"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap text-sm">
                    {profile.customer.notes ?? "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              <Card className="rounded-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {profile.summary.total_orders}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {formatMoney(profile.summary.total_spend, currency)}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-lg">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Last Purchase</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatDate(profile.summary.last_purchase_date)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                Completed and historical orders for this customer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Invoice</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {profile.orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-muted-foreground"
                        >
                          No purchases recorded for this customer.
                        </td>
                      </tr>
                    ) : (
                      profile.orders.map((order) => (
                        <tr key={order.order_id}>
                          <td className="px-4 py-3">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {order.order_id.slice(0, 8)}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {order.status}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {order.invoice_number ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div>{label(order.payment_method)}</div>
                            <div className="text-xs text-muted-foreground">
                              {label(order.payment_status)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {formatMoney(order.total_amount, currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>Returns & Refunds</CardTitle>
              <CardDescription>
                Refunds are shown separately from total spend.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      <th className="px-4 py-3 font-medium">Refund</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {profile.returns.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-muted-foreground"
                        >
                          No returns recorded for this customer.
                        </td>
                      </tr>
                    ) : (
                      profile.returns.map((returnRecord) => (
                        <tr key={returnRecord.return_id}>
                          <td className="px-4 py-3">
                            {formatDate(returnRecord.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            {returnRecord.order_id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3">
                            <div>{returnRecord.reason}</div>
                            <div className="text-xs text-muted-foreground">
                              {returnRecord.restock ? "Restocked" : "No restock"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>{label(returnRecord.refund_method)}</div>
                            <div className="text-xs text-muted-foreground">
                              {label(returnRecord.refund_status)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {formatMoney(
                              returnRecord.refund_amount ??
                                returnRecord.total_refund_amount,
                              currency
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  )
}

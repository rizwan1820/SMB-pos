"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Eye, FileText, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBusinessSettings } from "@/app/(app)/settings/_lib/settings-api"

type InvoiceSummary = {
  id: string
  invoice_number: string
  invoice_date: string
  order_id: string
  customer_name: string | null
  total_amount: string | number
  payment_method: string | null
  payment_status: string | null
}

function apiUrl(endpoint: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.")
  }

  return `${baseUrl}${endpoint}`
}

async function getInvoices(filters: {
  search: string
  startDate: string
  endDate: string
}) {
  const params = new URLSearchParams()

  if (filters.search.trim()) {
    params.set("search", filters.search.trim())
  }

  if (filters.startDate) {
    params.set("start_date", filters.startDate)
  }

  if (filters.endDate) {
    params.set("end_date", filters.endDate)
  }

  const query = params.toString()
  const response = await fetch(apiUrl(`/invoices${query ? `?${query}` : ""}`), {
    credentials: "include",
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Unable to load invoices.")
  }

  return response.json() as Promise<InvoiceSummary[]>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatMoney(value: string | number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value))
}

function titleCase(value: string | null) {
  if (!value) {
    return "Not recorded"
  }

  return value.replace(/_/g, " ").replace(/\b\w/g, (match) =>
    match.toUpperCase()
  )
}

export default function InvoicesPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)

    return () => window.clearTimeout(handle)
  }, [search])

  const invoicesQuery = useQuery({
    queryKey: ["invoices", { search: debouncedSearch, startDate, endDate }],
    queryFn: () => getInvoices({ search: debouncedSearch, startDate, endDate }),
  })
  const settingsQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: getBusinessSettings,
  })
  const invoices = invoicesQuery.data ?? []
  const currency = settingsQuery.data?.currency || "USD"
  const error =
    invoicesQuery.error instanceof Error ? invoicesQuery.error.message : null

  function clearFilters() {
    setSearch("")
    setStartDate("")
    setEndDate("")
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search invoice history using backend-confirmed totals.
        </p>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            Newest invoices appear first. Filters use invoice date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_auto] lg:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-search">Search</Label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-2.5 top-2 size-4 text-muted-foreground"
                />
                <Input
                  id="invoice-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-8"
                  placeholder="Invoice, order, or customer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoice-start-date">Start Date</Label>
              <Input
                id="invoice-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoice-end-date">End Date</Label>
              <Input
                id="invoice-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={!search && !startDate && !endDate}
            >
              <X aria-hidden="true" />
              Clear
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Invoice</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoicesQuery.isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText aria-hidden="true" className="size-8" />
                        <span>No invoices match these filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t">
                      <td className="px-3 py-3 font-medium">
                        <div>{invoice.invoice_number}</div>
                        <div className="text-xs text-muted-foreground">
                          Order {invoice.order_id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-3 py-3">
                        {invoice.customer_name || "Walk-in"}
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {formatMoney(invoice.total_amount, currency)}
                      </td>
                      <td className="px-3 py-3">
                        <div>{titleCase(invoice.payment_method)}</div>
                        <div className="text-xs text-muted-foreground">
                          {titleCase(invoice.payment_status)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
                        >
                          <Eye aria-hidden="true" className="size-4" />
                          View Invoice
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

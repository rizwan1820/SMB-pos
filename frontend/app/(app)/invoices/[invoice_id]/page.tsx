"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Download, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type InvoiceDetail = {
  invoice: {
    id: string
    invoice_number: string
    invoice_date: string
  }
  business: {
    name: string
    logo_url: string | null
    address: string | null
    phone: string | null
    email: string | null
    currency: string
    tax_label: string
    invoice_business_name: string | null
    invoice_business_details: string | null
  }
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
  } | null
  items: Array<{
    product_id: string
    product_name: string
    quantity: string | number
    unit_price: string | number
    discount_amount: string | number
    tax_amount: string | number
    line_total: string | number
  }>
  totals: {
    subtotal: string | number
    discount_amount: string | number
    tax_amount: string | number
    total_amount: string | number
  }
  payment: {
    method: string
    amount: string | number
    status: string
    reference: string | null
  }
}

function apiUrl(endpoint: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.")
  }

  return `${baseUrl}${endpoint}`
}

function formatMoney(value: string | number, currency: string) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(0)
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date)
}

export default function InvoicePage() {
  const params = useParams<{ invoice_id: string }>()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadInvoice() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          apiUrl(`/invoices/${params.invoice_id}`),
          {
            credentials: "include",
          }
        )

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || "Unable to load invoice.")
        }

        const data = (await response.json()) as InvoiceDetail

        if (active) {
          setInvoice(data)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load invoice."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInvoice()

    return () => {
      active = false
    }
  }, [params.invoice_id])

  if (loading) {
    return (
      <main className="flex min-h-[420px] items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading invoice...
        </span>
      </main>
    )
  }

  if (error) {
    return (
      <main className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-normal">Invoice</h1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </main>
    )
  }

  if (!invoice) {
    return null
  }

  const businessDisplayName =
    invoice.business.invoice_business_name || invoice.business.name
  const currency = invoice.business.currency || "USD"
  const taxLabel = invoice.business.tax_label || "Tax"

  async function downloadPdf() {
    if (!invoice || downloading) {
      return
    }

    setDownloading(true)
    setError(null)

    try {
      const response = await fetch(
        apiUrl(`/invoices/${params.invoice_id}/pdf`),
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "Unable to download invoice PDF.")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = `${invoice.invoice.invoice_number}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download invoice PDF."
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="space-y-5">
      <div className="print-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Invoice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.invoice.invoice_number}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={downloading}
            onClick={downloadPdf}
          >
            <Download aria-hidden="true" />
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Print Invoice
          </Button>
        </div>
      </div>

      <Card className="invoice-print-area rounded-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl">
                {businessDisplayName}
              </CardTitle>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {invoice.business.logo_url ? (
                  <img
                    src={invoice.business.logo_url}
                    alt=""
                    className="mb-3 max-h-16 max-w-48 object-contain"
                  />
                ) : null}
                {invoice.business.address ? (
                  <p>{invoice.business.address}</p>
                ) : null}
                {invoice.business.phone ? (
                  <p>{invoice.business.phone}</p>
                ) : null}
                {invoice.business.email ? (
                  <p>{invoice.business.email}</p>
                ) : null}
                {invoice.business.invoice_business_details ? (
                  <p className="whitespace-pre-line">
                    {invoice.business.invoice_business_details}
                  </p>
                ) : null}
                <p>Invoice</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-semibold tabular-nums">
                {invoice.invoice.invoice_number}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Invoice Date
              </p>
              <p className="font-medium">
                {formatDate(invoice.invoice.invoice_date)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 rounded-lg border p-4 text-sm">
              <p className="font-medium">Bill To</p>
              {invoice.customer ? (
                <>
                  <p>{invoice.customer.name}</p>
                  {invoice.customer.phone ? (
                    <p className="text-muted-foreground">
                      {invoice.customer.phone}
                    </p>
                  ) : null}
                  {invoice.customer.email ? (
                    <p className="text-muted-foreground">
                      {invoice.customer.email}
                    </p>
                  ) : null}
                  {invoice.customer.address ? (
                    <p className="text-muted-foreground">
                      {invoice.customer.address}
                    </p>
                  ) : null}
                </>
              ) : (
                <p>Walk-in Customer</p>
              )}
            </div>

            <div className="space-y-2 rounded-lg border p-4 text-sm">
              <p className="font-medium">Payment</p>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{invoice.payment.method}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Amount</span>
                <span className="tabular-nums">
                  {formatMoney(invoice.payment.amount, currency)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{invoice.payment.status}</span>
              </div>
              {invoice.payment.reference ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="break-all text-right">
                    {invoice.payment.reference}
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {taxLabel}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.items.map((item) => (
                    <tr key={item.product_id} className="bg-card">
                      <td className="px-4 py-3 font-medium">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(item.unit_price, currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(item.discount_amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(item.tax_amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatMoney(item.line_total, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex justify-end">
            <div className="w-full space-y-2 rounded-lg border p-4 text-sm sm:max-w-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatMoney(invoice.totals.subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Discount</span>
                <span className="tabular-nums">
                  {formatMoney(invoice.totals.discount_amount, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{taxLabel}</span>
                <span className="tabular-nums">
                  {formatMoney(invoice.totals.tax_amount, currency)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Final Total</span>
                <span className="tabular-nums">
                  {formatMoney(invoice.totals.total_amount, currency)}
                </span>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}

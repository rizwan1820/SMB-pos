"use client"

import { useQueryClient } from "@tanstack/react-query"
import { FormEvent, useEffect, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StockReceiptDetailPanel } from "@/app/(app)/inventory/receipts/_components/stock-receipt-detail-panel"
import { StockReceiptForm } from "@/app/(app)/inventory/receipts/_components/stock-receipt-form"
import {
  estimatedReceiptTotal,
  validateReceiptForm,
} from "@/app/(app)/inventory/receipts/_components/stock-receipt-form"
import { StockReceiptHistoryTable } from "@/app/(app)/inventory/receipts/_components/stock-receipt-history-table"
import {
  createStockReceipt,
  formatMoney,
  getReceiptProducts,
  getReceiptSuppliers,
  getStockReceipt,
  getStockReceipts,
} from "@/app/(app)/inventory/receipts/_lib/stock-receipt-api"
import {
  emptyReceiptForm,
  ProductOption,
  StockReceiptDetail,
  StockReceiptFormState,
  StockReceiptListItem,
  SupplierOption,
  todayDate,
} from "@/app/(app)/inventory/receipts/_lib/stock-receipt-types"
import { getBusinessSettings } from "@/app/(app)/settings/_lib/settings-api"

function freshReceiptForm(): StockReceiptFormState {
  return {
    ...emptyReceiptForm,
    receipt_date: todayDate(),
    items: emptyReceiptForm.items.map((item) => ({ ...item })),
  }
}

export default function StockReceiptsPage() {
  const queryClient = useQueryClient()
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [receipts, setReceipts] = useState<StockReceiptListItem[]>([])
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null
  )
  const [selectedReceipt, setSelectedReceipt] =
    useState<StockReceiptDetail | null>(null)
  const [form, setForm] = useState<StockReceiptFormState>(freshReceiptForm)
  const [currency, setCurrency] = useState("USD")
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadReceipts() {
    const receiptData = await getStockReceipts()

    setReceipts(receiptData)
  }

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      setLoadingInitial(true)
      setError(null)

      try {
        const [supplierData, productData, receiptData, settings] =
          await Promise.all([
            getReceiptSuppliers(),
            getReceiptProducts(),
            getStockReceipts(),
            getBusinessSettings(),
          ])

        if (!active) {
          return
        }

        setSuppliers(supplierData)
        setProducts(productData)
        setReceipts(receiptData)
        setCurrency(settings.currency || "USD")
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load stock receipts."
          )
        }
      } finally {
        if (active) {
          setLoadingInitial(false)
        }
      }
    }

    loadInitialData()

    return () => {
      active = false
    }
  }, [])

  async function viewReceipt(receipt: StockReceiptListItem) {
    setSelectedReceiptId(receipt.id)
    setSelectedReceipt(null)
    setLoadingDetail(true)
    setDetailError(null)

    try {
      const detail = await getStockReceipt(receipt.id)

      setSelectedReceipt(detail)
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Unable to load receipt detail."
      )
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    const validationError = validateReceiptForm(form)

    if (validationError) {
      setFormError(validationError)
      return
    }

    setSubmitting(true)
    setFormError(null)
    setSuccess(null)

    try {
      const receipt = await createStockReceipt(form)

      setSuccess(
        `Receipt completed for ${formatMoney(receipt.total_cost, currency)}.`
      )
      setForm(freshReceiptForm())
      await loadReceipts()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["pos", "products"] }),
      ])
      setSelectedReceiptId(receipt.id)
      setSelectedReceipt(receipt)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to complete receipt."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Stock Receipts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receive supplier stock with backend-confirmed inventory movements.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <div className="space-y-4">
          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>Receive From Supplier</CardTitle>
              <CardDescription>
                Estimated totals are for entry review; backend totals are final.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockReceiptForm
                suppliers={suppliers}
                products={products}
                form={form}
                currency={currency}
                submitting={submitting}
                error={formError}
                onFormChange={(nextForm) => {
                  setForm(nextForm)
                  setFormError(null)
                  setSuccess(null)
                }}
                onSubmit={handleSubmit}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>Receipt History</CardTitle>
              <CardDescription>
                Newest supplier receipts appear first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockReceiptHistoryTable
                receipts={receipts}
                selectedReceiptId={selectedReceiptId}
                loading={loadingInitial}
                currency={currency}
                onView={viewReceipt}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Receipt Detail</CardTitle>
            <CardDescription>
              Item costs and totals are returned by the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockReceiptDetailPanel
              receipt={selectedReceipt}
              loading={loadingDetail}
              error={detailError}
              currency={currency}
            />
          </CardContent>
        </Card>
      </div>

      <p className="sr-only">
        Current estimated receipt total is{" "}
        {formatMoney(estimatedReceiptTotal(form), currency)}.
      </p>
    </main>
  )
}

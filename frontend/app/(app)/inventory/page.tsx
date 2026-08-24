"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { Boxes, ClipboardList, PackageCheck, Truck } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InventoryActionForm } from "@/app/(app)/inventory/_components/inventory-action-form"
import { LowStockList } from "@/app/(app)/inventory/_components/low-stock-list"
import { MovementHistoryTable } from "@/app/(app)/inventory/_components/movement-history-table"
import { ProductSelector } from "@/app/(app)/inventory/_components/product-selector"
import {
  createInventoryMovement,
  formatQuantity,
  getLowStockProducts,
  getProductMovements,
  getProducts,
  getProductStock,
} from "@/app/(app)/inventory/_lib/inventory-api"
import {
  emptyInventoryForm,
  InventoryAction,
  InventoryFormState,
  InventoryMovement,
  LowStockProduct,
  Product,
  StockSummary,
} from "@/app/(app)/inventory/_lib/inventory-types"

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [action, setAction] = useState<InventoryAction>("receive")
  const [form, setForm] = useState<InventoryFormState>(emptyInventoryForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const productsQuery = useQuery({
    queryKey: ["inventory", "products"],
    queryFn: getProducts,
  })
  const lowStockQuery = useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: getLowStockProducts,
  })
  const stockQuery = useQuery({
    queryKey: ["inventory", "stock", selectedProductId],
    queryFn: () => getProductStock(selectedProductId),
    enabled: Boolean(selectedProductId),
  })
  const movementsQuery = useQuery({
    queryKey: ["inventory", "movements", selectedProductId],
    queryFn: () => getProductMovements(selectedProductId),
    enabled: Boolean(selectedProductId),
  })

  const products = productsQuery.data ?? []
  const lowStockProducts = lowStockQuery.data ?? []
  const stock = stockQuery.data ?? null
  const movements = movementsQuery.data ?? []
  const loadingProduct =
    Boolean(selectedProductId) &&
    (stockQuery.isLoading || movementsQuery.isLoading)
  const error =
    actionError ??
    (productsQuery.error instanceof Error ? productsQuery.error.message : null) ??
    (lowStockQuery.error instanceof Error ? lowStockQuery.error.message : null) ??
    (stockQuery.error instanceof Error ? stockQuery.error.message : null) ??
    (movementsQuery.error instanceof Error ? movementsQuery.error.message : null)
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) {
      return
    }

    if (!selectedProductId) {
      setFormError("Select a product before recording inventory.")
      return
    }

    if (Number(form.quantity) <= 0) {
      setFormError("Quantity must be greater than 0.")
      return
    }

    if ((action === "damaged" || action === "lost") && !form.notes.trim()) {
      setFormError("Notes are required for damaged or lost stock.")
      return
    }

    setSaving(true)
    setFormError(null)
    setActionError(null)

    try {
      await createInventoryMovement(action, selectedProductId, form)
      setForm(emptyInventoryForm)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["inventory", "stock", selectedProductId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["inventory", "movements", selectedProductId],
        }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ])
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save inventory movement."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track stock levels, receive goods, and review product movement.
          </p>
        </div>
        <Link
          href="/inventory/receipts"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Truck aria-hidden="true" className="size-4" />
          Stock Receipts
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>Product Stock</CardTitle>
              <CardDescription>
                Select a product to view current stock and inventory history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductSelector
                products={products}
                productSearch={productSearch}
                selectedProductId={selectedProductId}
                onProductSearchChange={setProductSearch}
                onProductChange={setSelectedProductId}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PackageCheck className="size-4" aria-hidden="true" />
                    Current stock
                  </div>
                  <p className="mt-3 text-3xl font-semibold tabular-nums">
                    {loadingProduct
                      ? "..."
                      : stock
                        ? formatQuantity(stock.current_stock)
                        : "-"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Boxes className="size-4" aria-hidden="true" />
                    Product
                  </div>
                  <p className="mt-3 truncate text-base font-medium">
                    {selectedProduct?.name ?? "No product selected"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedProduct?.sku ?? "-"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardList className="size-4" aria-hidden="true" />
                    Movements
                  </div>
                  <p className="mt-3 text-3xl font-semibold tabular-nums">
                    {loadingProduct ? "..." : movements.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>Record Movement</CardTitle>
              <CardDescription>
                Add opening stock, receive stock, or post an adjustment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryActionForm
                selectedProductId={selectedProductId}
                action={action}
                form={form}
                saving={saving}
                formError={formError}
                onActionChange={setAction}
                onFormChange={setForm}
                onSubmit={handleSubmit}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <CardTitle>Movement History</CardTitle>
              <CardDescription>
                Review stock changes for the selected product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MovementHistoryTable
                movements={movements}
                loading={loadingProduct}
                hasSelectedProduct={Boolean(selectedProductId)}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Low Stock</CardTitle>
            <CardDescription>
              Products at or below their reorder threshold.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockList
              products={lowStockProducts}
              loading={lowStockQuery.isLoading}
              onSelectProduct={setSelectedProductId}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

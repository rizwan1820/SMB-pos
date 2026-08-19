"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Boxes, ClipboardList, PackageCheck } from "lucide-react"

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
  const [products, setProducts] = useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    []
  )
  const [stock, setStock] = useState<StockSummary | null>(null)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [action, setAction] = useState<InventoryAction>("receive")
  const [form, setForm] = useState<InventoryFormState>(emptyInventoryForm)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  )

  async function loadLowStock() {
    const data = await getLowStockProducts()

    setLowStockProducts(data)
  }

  async function loadSelectedProduct(productId: string) {
    if (!productId) {
      setStock(null)
      setMovements([])
      return
    }

    setLoadingProduct(true)
    setError(null)

    try {
      const [stockData, movementData] = await Promise.all([
        getProductStock(productId),
        getProductMovements(productId),
      ])

      setStock(stockData)
      setMovements(movementData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load inventory for this product."
      )
    } finally {
      setLoadingProduct(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInventory() {
      setLoadingInitial(true)
      setError(null)

      try {
        const [productData, lowStockData] = await Promise.all([
          getProducts(),
          getLowStockProducts(),
        ])

        if (!active) {
          return
        }

        setProducts(productData)
        setLowStockProducts(lowStockData)
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load inventory."
          )
        }
      } finally {
        if (active) {
          setLoadingInitial(false)
        }
      }
    }

    loadInventory()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    loadSelectedProduct(selectedProductId)
  }, [selectedProductId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedProductId) {
      setFormError("Select a product before recording inventory.")
      return
    }

    setSaving(true)
    setFormError(null)
    setError(null)

    try {
      await createInventoryMovement(action, selectedProductId, form)
      setForm(emptyInventoryForm)
      await Promise.all([loadSelectedProduct(selectedProductId), loadLowStock()])
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
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track stock levels, receive goods, and review product movement.
        </p>
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
              loading={loadingInitial}
              onSelectProduct={setSelectedProductId}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

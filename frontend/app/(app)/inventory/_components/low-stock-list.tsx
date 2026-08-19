"use client"

import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatQuantity } from "@/app/(app)/inventory/_lib/inventory-api"
import { LowStockProduct } from "@/app/(app)/inventory/_lib/inventory-types"

type LowStockListProps = {
  products: LowStockProduct[]
  loading: boolean
  onSelectProduct: (productId: string) => void
}

export function LowStockList({
  products,
  loading,
  onSelectProduct,
}: LowStockListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No low-stock products right now.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="truncate font-medium">{product.name}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {product.sku} · Stock {formatQuantity(product.current_stock)} /
              Threshold {product.low_stock_threshold}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectProduct(product.id)}
          >
            Select
          </Button>
        </div>
      ))}
    </div>
  )
}

"use client"

import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toMoney } from "@/app/(app)/pos/_lib/pos-api"
import type { Product } from "@/app/(app)/pos/_lib/pos-types"

type ProductPickerProps = {
  products: Product[]
  search: string
  loading: boolean
  onSearchChange: (value: string) => void
  onAddProduct: (product: Product) => void
}

export function ProductPicker({
  products,
  search,
  loading,
  onSearchChange,
  onAddProduct,
}: ProductPickerProps) {
  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return true
    }

    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-8"
          placeholder="Search products by name or SKU"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
            No products match your search.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Button
              key={product.id}
              type="button"
              variant="outline"
              className="h-auto justify-start whitespace-normal p-3 text-left"
              onClick={() => onAddProduct(product)}
            >
              <span className="block min-w-0">
                <span className="block truncate font-medium">{product.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {product.sku}
                </span>
                <span className="mt-2 flex items-center gap-3 text-sm">
                  <span>{toMoney(product.selling_price)}</span>
                  <span className="text-muted-foreground">
                    Tax {product.tax_rate}%
                  </span>
                </span>
              </span>
            </Button>
          ))
        )}
      </div>
    </div>
  )
}

"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Product } from "@/app/(app)/inventory/_lib/inventory-types"

type ProductSelectorProps = {
  products: Product[]
  productSearch: string
  selectedProductId: string
  onProductSearchChange: (value: string) => void
  onProductChange: (value: string) => void
}

export function ProductSelector({
  products,
  productSearch,
  selectedProductId,
  onProductSearchChange,
  onProductChange,
}: ProductSelectorProps) {
  const filteredProducts = products.filter((product) => {
    const query = productSearch.trim().toLowerCase()

    if (!query) {
      return true
    }

    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    )
  })

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(260px,420px)]">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-8"
          placeholder="Search products by name or SKU"
          value={productSearch}
          onChange={(event) => onProductSearchChange(event.target.value)}
        />
      </div>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={selectedProductId}
        onChange={(event) => onProductChange(event.target.value)}
      >
        <option value="">Select product</option>
        {filteredProducts.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} ({product.sku})
          </option>
        ))}
      </select>
    </div>
  )
}

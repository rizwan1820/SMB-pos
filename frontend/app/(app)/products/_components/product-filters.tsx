"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Category, productStatusOptions } from "@/app/(app)/products/_lib/product-types"

type ProductFiltersProps = {
  categories: Category[]
  search: string
  categoryId: string
  status: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function ProductFilters({
  categories,
  search,
  categoryId,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: ProductFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_180px]">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-8"
          placeholder="Search name or SKU"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={categoryId}
        onChange={(event) => onCategoryChange(event.target.value)}
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm capitalize outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        <option value="all">All statuses</option>
        {productStatusOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

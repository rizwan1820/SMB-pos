"use client"

import { FormEvent } from "react"
import { Loader2, X } from "lucide-react"

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
import {
  Category,
  Product,
  ProductFormState,
  productStatusOptions,
} from "@/app/(app)/products/_lib/product-types"

type ProductFormDialogProps = {
  categories: Category[]
  editingProduct: Product | null
  form: ProductFormState
  formError: string | null
  saving: boolean
  onFormChange: (form: ProductFormState) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ProductFormDialog({
  categories,
  editingProduct,
  form,
  formError,
  saving,
  onFormChange,
  onClose,
  onSubmit,
}: ProductFormDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                {editingProduct ? "Edit Product" : "Add Product"}
              </CardTitle>
              <CardDescription>
                {editingProduct
                  ? "Update catalog details for this product."
                  : "Create a product in the current business catalog."}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Close form"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(event) =>
                    onFormChange({ ...form, name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  required
                  value={form.sku}
                  onChange={(event) =>
                    onFormChange({ ...form, sku: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  required
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={form.category_id}
                  onChange={(event) =>
                    onFormChange({ ...form, category_id: event.target.value })
                  }
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  required
                  value={form.barcode}
                  onChange={(event) =>
                    onFormChange({ ...form, barcode: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost-price">Cost price</Label>
                <Input
                  id="cost-price"
                  min="0"
                  required
                  step="0.01"
                  type="number"
                  value={form.cost_price}
                  onChange={(event) =>
                    onFormChange({ ...form, cost_price: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling-price">Selling price</Label>
                <Input
                  id="selling-price"
                  min="0"
                  required
                  step="0.01"
                  type="number"
                  value={form.selling_price}
                  onChange={(event) =>
                    onFormChange({
                      ...form,
                      selling_price: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax rate</Label>
                <Input
                  id="tax-rate"
                  min="0"
                  required
                  step="0.01"
                  type="number"
                  value={form.tax_rate}
                  onChange={(event) =>
                    onFormChange({ ...form, tax_rate: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="low-stock">Low stock threshold</Label>
                <Input
                  id="low-stock"
                  min="0"
                  required
                  step="1"
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(event) =>
                    onFormChange({
                      ...form,
                      low_stock_threshold: event.target.value,
                    })
                  }
                />
              </div>
              {editingProduct ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm capitalize outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={form.status}
                    onChange={(event) =>
                      onFormChange({ ...form, status: event.target.value })
                    }
                  >
                    {productStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            {formError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : null}
                {editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

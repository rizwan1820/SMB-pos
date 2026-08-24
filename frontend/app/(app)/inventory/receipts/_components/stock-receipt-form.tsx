"use client"

import { FormEvent } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoney } from "@/app/(app)/inventory/receipts/_lib/stock-receipt-api"
import type {
  ProductOption,
  StockReceiptFormState,
  SupplierOption,
} from "@/app/(app)/inventory/receipts/_lib/stock-receipt-types"
import { emptyReceiptItem } from "@/app/(app)/inventory/receipts/_lib/stock-receipt-types"

type StockReceiptFormProps = {
  suppliers: SupplierOption[]
  products: ProductOption[]
  form: StockReceiptFormState
  currency: string
  submitting: boolean
  error: string | null
  onFormChange: (form: StockReceiptFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function lineTotal(quantity: string, unitCost: string) {
  const qty = Number(quantity)
  const cost = Number(unitCost)

  if (Number.isNaN(qty) || Number.isNaN(cost)) {
    return 0
  }

  return qty * cost
}

export function estimatedReceiptTotal(form: StockReceiptFormState) {
  return form.items.reduce(
    (total, item) => total + lineTotal(item.quantity, item.unit_cost),
    0
  )
}

export function validateReceiptForm(form: StockReceiptFormState) {
  if (!form.supplier_id) {
    return "Select a supplier."
  }

  if (!form.receipt_date) {
    return "Enter a receipt date."
  }

  if (form.items.length === 0) {
    return "Add at least one receipt item."
  }

  const selectedProducts = new Set<string>()

  for (const [index, item] of form.items.entries()) {
    const lineNumber = index + 1

    if (!item.product_id) {
      return `Select a product for line ${lineNumber}.`
    }

    if (selectedProducts.has(item.product_id)) {
      return "Duplicate product lines are not allowed."
    }

    selectedProducts.add(item.product_id)

    if (Number(item.quantity) <= 0) {
      return `Quantity must be greater than 0 on line ${lineNumber}.`
    }

    if (Number(item.unit_cost) < 0 || item.unit_cost === "") {
      return `Unit cost must be 0 or greater on line ${lineNumber}.`
    }
  }

  return null
}

export function StockReceiptForm({
  suppliers,
  products,
  form,
  currency,
  submitting,
  error,
  onFormChange,
  onSubmit,
}: StockReceiptFormProps) {
  function updateItem(index: number, field: string, value: string) {
    onFormChange({
      ...form,
      items: form.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    })
  }

  function addItem() {
    onFormChange({
      ...form,
      items: [...form.items, { ...emptyReceiptItem }],
    })
  }

  function removeItem(index: number) {
    if (form.items.length === 1) {
      return
    }

    onFormChange({
      ...form,
      items: form.items.filter((_, itemIndex) => itemIndex !== index),
    })
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="receipt-supplier">Supplier</Label>
          <select
            id="receipt-supplier"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={form.supplier_id}
            onChange={(event) =>
              onFormChange({ ...form, supplier_id: event.target.value })
            }
            required
          >
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="receipt-date">Receipt Date</Label>
          <Input
            id="receipt-date"
            type="date"
            value={form.receipt_date}
            onChange={(event) =>
              onFormChange({ ...form, receipt_date: event.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receipt-reference">Reference</Label>
          <Input
            id="receipt-reference"
            placeholder="Supplier invoice number"
            value={form.reference}
            onChange={(event) =>
              onFormChange({ ...form, reference: event.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receipt-notes">Notes</Label>
          <Input
            id="receipt-notes"
            placeholder="Optional receiving notes"
            value={form.notes}
            onChange={(event) =>
              onFormChange({ ...form, notes: event.target.value })
            }
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Quantity</th>
              <th className="px-3 py-3 font-medium">Unit Cost</th>
              <th className="px-3 py-3 text-right font-medium">Line Total</th>
              <th className="px-3 py-3 text-right font-medium">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {form.items.map((item, index) => (
              <tr key={index}>
                <td className="px-3 py-3">
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={item.product_id}
                    onChange={(event) =>
                      updateItem(index, "product_id", event.target.value)
                    }
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                    required
                  />
                </td>
                <td className="px-3 py-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_cost}
                    onChange={(event) =>
                      updateItem(index, "unit_cost", event.target.value)
                    }
                    required
                  />
                </td>
                <td className="px-3 py-3 text-right font-medium tabular-nums">
                  {formatMoney(
                    lineTotal(item.quantity, item.unit_cost),
                    currency
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove receipt item"
                    disabled={form.items.length === 1}
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus aria-hidden="true" />
          Add Item
        </Button>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Estimated total</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(estimatedReceiptTotal(form), currency)}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : null}
          Complete Receipt
        </Button>
      </div>
    </form>
  )
}

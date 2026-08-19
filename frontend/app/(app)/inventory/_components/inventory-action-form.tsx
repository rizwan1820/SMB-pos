"use client"

import { FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  InventoryAction,
  InventoryFormState,
} from "@/app/(app)/inventory/_lib/inventory-types"

type InventoryActionFormProps = {
  selectedProductId: string
  action: InventoryAction
  form: InventoryFormState
  saving: boolean
  formError: string | null
  onActionChange: (value: InventoryAction) => void
  onFormChange: (form: InventoryFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const actionLabels: Record<InventoryAction, string> = {
  opening: "Opening Stock",
  receive: "Receive Stock",
  adjust: "Adjust Stock",
}

export function InventoryActionForm({
  selectedProductId,
  action,
  form,
  saving,
  formError,
  onActionChange,
  onFormChange,
  onSubmit,
}: InventoryActionFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="movement-type">Action</Label>
          <select
            id="movement-type"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={action}
            onChange={(event) =>
              onActionChange(event.target.value as InventoryAction)
            }
          >
            <option value="opening">Opening Stock</option>
            <option value="receive">Receive Stock</option>
            <option value="adjust">Adjust Stock</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            required
            step="0.001"
            type="number"
            value={form.quantity}
            onChange={(event) =>
              onFormChange({ ...form, quantity: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            placeholder="Invoice, count, or reason"
            value={form.reference}
            onChange={(event) =>
              onFormChange({ ...form, reference: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            placeholder="Optional notes"
            value={form.notes}
            onChange={(event) =>
              onFormChange({ ...form, notes: event.target.value })
            }
          />
        </div>
      </div>

      {formError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={!selectedProductId || saving}>
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {actionLabels[action]}
        </Button>
      </div>
    </form>
  )
}

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
  customerStatusOptions,
  Customer,
  CustomerFormState,
} from "@/app/(app)/customers/_lib/customer-types"

type CustomerFormDialogProps = {
  editingCustomer: Customer | null
  form: CustomerFormState
  formError: string | null
  saving: boolean
  onFormChange: (form: CustomerFormState) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CustomerFormDialog({
  editingCustomer,
  form,
  formError,
  saving,
  onFormChange,
  onClose,
  onSubmit,
}: CustomerFormDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                {editingCustomer ? "Edit Customer" : "Add Customer"}
              </CardTitle>
              <CardDescription>
                {editingCustomer
                  ? "Update this customer record."
                  : "Create a new customer profile."}
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
              <div className="space-y-2 sm:col-span-2">
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) =>
                    onFormChange({ ...form, phone: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    onFormChange({ ...form, email: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(event) =>
                    onFormChange({ ...form, address: event.target.value })
                  }
                />
              </div>
              {editingCustomer ? (
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
                    {customerStatusOptions.map((option) => (
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
                {editingCustomer ? "Save Changes" : "Create Customer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

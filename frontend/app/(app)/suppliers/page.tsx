"use client"

import { FormEvent, useEffect, useState } from "react"
import { Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArchiveSupplierDialog } from "@/app/(app)/suppliers/_components/archive-supplier-dialog"
import { SupplierFormDialog } from "@/app/(app)/suppliers/_components/supplier-form-dialog"
import { SupplierTable } from "@/app/(app)/suppliers/_components/supplier-table"
import {
  archiveSupplier,
  createSupplier,
  getSuppliers,
  supplierToForm,
  updateSupplier,
} from "@/app/(app)/suppliers/_lib/supplier-api"
import {
  emptySupplierForm,
  Supplier,
  SupplierFormState,
} from "@/app/(app)/suppliers/_lib/supplier-types"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierToArchive, setSupplierToArchive] = useState<Supplier | null>(
    null
  )
  const [form, setForm] = useState<SupplierFormState>(emptySupplierForm)

  async function loadSuppliers() {
    setLoading(true)
    setError(null)

    try {
      const data = await getSuppliers()

      setSuppliers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load suppliers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  function openAddForm() {
    setEditingSupplier(null)
    setForm(emptySupplierForm)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(supplier: Supplier) {
    setEditingSupplier(supplier)
    setForm(supplierToForm(supplier))
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, form)
      } else {
        await createSupplier(form)
      }

      setFormOpen(false)
      await loadSuppliers()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save supplier."
      )
    } finally {
      setSaving(false)
    }
  }

  async function confirmArchive() {
    if (!supplierToArchive) {
      return
    }

    setArchivingId(supplierToArchive.id)
    setError(null)

    try {
      await archiveSupplier(supplierToArchive.id)
      setSupplierToArchive(null)
      await loadSuppliers()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to archive supplier."
      )
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Suppliers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage vendor contacts and supplier account status.
          </p>
        </div>
        <Button onClick={openAddForm}>
          <Truck aria-hidden="true" />
          Add Supplier
        </Button>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Supplier Directory</CardTitle>
          <CardDescription>
            Review supplier contact details and purchasing status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <SupplierTable
            suppliers={suppliers}
            loading={loading}
            archivingId={archivingId}
            onEdit={openEditForm}
            onArchive={setSupplierToArchive}
          />
        </CardContent>
      </Card>

      {formOpen ? (
        <SupplierFormDialog
          editingSupplier={editingSupplier}
          form={form}
          formError={formError}
          saving={saving}
          onFormChange={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {supplierToArchive ? (
        <ArchiveSupplierDialog
          supplier={supplierToArchive}
          archiving={archivingId === supplierToArchive.id}
          onCancel={() => setSupplierToArchive(null)}
          onConfirm={confirmArchive}
        />
      ) : null}
    </main>
  )
}

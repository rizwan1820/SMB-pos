"use client"

import { FormEvent, useEffect, useState } from "react"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArchiveCustomerDialog } from "@/app/(app)/customers/_components/archive-customer-dialog"
import { CustomerFormDialog } from "@/app/(app)/customers/_components/customer-form-dialog"
import { CustomerSearch } from "@/app/(app)/customers/_components/customer-search"
import { CustomerTable } from "@/app/(app)/customers/_components/customer-table"
import {
  archiveCustomer,
  createCustomer,
  customerToForm,
  getCustomers,
  updateCustomer,
} from "@/app/(app)/customers/_lib/customer-api"
import {
  Customer,
  CustomerFormState,
  emptyCustomerForm,
} from "@/app/(app)/customers/_lib/customer-types"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(
    null
  )
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm)

  async function loadCustomers() {
    setLoading(true)
    setError(null)

    try {
      const data = await getCustomers(search)

      setCustomers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load customers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadCustomers()
    }, 250)

    return () => window.clearTimeout(handle)
  }, [search])

  function openAddForm() {
    setEditingCustomer(null)
    setForm(emptyCustomerForm)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(customer: Customer) {
    setEditingCustomer(customer)
    setForm(customerToForm(customer))
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, form)
      } else {
        await createCustomer(form)
      }

      setFormOpen(false)
      await loadCustomers()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save customer."
      )
    } finally {
      setSaving(false)
    }
  }

  async function confirmArchive() {
    if (!customerToArchive) {
      return
    }

    setArchivingId(customerToArchive.id)
    setError(null)

    try {
      await archiveCustomer(customerToArchive.id)
      setCustomerToArchive(null)
      await loadCustomers()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to archive customer."
      )
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer profiles, contact details, and account status.
          </p>
        </div>
        <Button onClick={openAddForm}>
          <UserPlus aria-hidden="true" />
          Add Customer
        </Button>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>
            Search customer records by name, phone, or email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomerSearch search={search} onSearchChange={setSearch} />

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <CustomerTable
            customers={customers}
            loading={loading}
            archivingId={archivingId}
            onEdit={openEditForm}
            onArchive={setCustomerToArchive}
          />
        </CardContent>
      </Card>

      {formOpen ? (
        <CustomerFormDialog
          editingCustomer={editingCustomer}
          form={form}
          formError={formError}
          saving={saving}
          onFormChange={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {customerToArchive ? (
        <ArchiveCustomerDialog
          customer={customerToArchive}
          archiving={archivingId === customerToArchive.id}
          onCancel={() => setCustomerToArchive(null)}
          onConfirm={confirmArchive}
        />
      ) : null}
    </main>
  )
}

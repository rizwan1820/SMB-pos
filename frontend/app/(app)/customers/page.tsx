"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
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
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(
    null
  )
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)

    return () => window.clearTimeout(handle)
  }, [search])

  const customersQuery = useQuery({
    queryKey: ["customers", { search: debouncedSearch }],
    queryFn: () => getCustomers(debouncedSearch),
  })
  const customers = customersQuery.data ?? []
  const error =
    actionError ??
    (customersQuery.error instanceof Error ? customersQuery.error.message : null)

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

    if (saving) {
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, form)
      } else {
        await createCustomer(form)
      }

      setFormOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
        queryClient.invalidateQueries({ queryKey: ["pos", "customers"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "customers"] }),
        queryClient.invalidateQueries({ queryKey: ["reports", "customers"] }),
      ])
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save customer."
      )
    } finally {
      setSaving(false)
    }
  }

  async function confirmArchive() {
    if (!customerToArchive || archivingId) {
      return
    }

    setArchivingId(customerToArchive.id)
    setActionError(null)

    try {
      await archiveCustomer(customerToArchive.id)
      setCustomerToArchive(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
        queryClient.invalidateQueries({ queryKey: ["pos", "customers"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "customers"] }),
        queryClient.invalidateQueries({ queryKey: ["reports", "customers"] }),
      ])
    } catch (err) {
      setActionError(
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
            loading={customersQuery.isLoading}
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

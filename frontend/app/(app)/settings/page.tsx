"use client"

import type { ReactNode } from "react"
import { FormEvent, useEffect, useState } from "react"
import { Building2, FileText, Percent, Save } from "lucide-react"

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
  getBusinessSettings,
  settingsToForm,
  updateBusinessSettings,
} from "@/app/(app)/settings/_lib/settings-api"
import {
  emptyBusinessSettingsForm,
  type BusinessSettingsForm,
} from "@/app/(app)/settings/_lib/settings-types"

export default function SettingsPage() {
  const [form, setForm] = useState<BusinessSettingsForm>(
    emptyBusinessSettingsForm
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      setLoading(true)
      setError(null)

      try {
        const settings = await getBusinessSettings()

        if (active) {
          setForm(settingsToForm(settings))
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load business settings."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      active = false
    }
  }, [])

  function updateForm(field: keyof BusinessSettingsForm, value: string) {
    setSuccess(null)
    setForm((current) => ({
      ...current,
      [field]: field === "currency" ? value.toUpperCase() : value,
    }))
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Business name is required."
    }

    if (!/^[A-Z]{3}$/.test(form.currency.trim().toUpperCase())) {
      return "Currency must be a 3-letter uppercase code."
    }

    const taxRate = Number(form.default_tax_rate)

    if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      return "Default tax rate must be between 0 and 100."
    }

    if (!form.tax_label.trim()) {
      return "Tax label is required."
    }

    const invoicePrefix = form.invoice_prefix.trim().toUpperCase()

    if (!invoicePrefix) {
      return "Invoice prefix is required."
    }

    if (invoicePrefix.length > 20) {
      return "Invoice prefix must be 20 characters or fewer."
    }

    if (!/^[A-Z0-9]+$/.test(invoicePrefix)) {
      return "Invoice prefix may contain only letters and numbers."
    }

    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) {
      return
    }

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      return
    }

    setSaving(true)
    setFormError(null)
    setError(null)
    setSuccess(null)

    try {
      const settings = await updateBusinessSettings(form)
      setForm(settingsToForm(settings))
      setSuccess("Business settings saved.")
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save settings."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Loading business settings...
          </p>
        </div>
        <div className="grid gap-4">
          <Card className="min-h-52 animate-pulse rounded-lg" />
          <Card className="min-h-52 animate-pulse rounded-lg" />
        </div>
      </main>
    )
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure business identity, tax defaults, and invoice details.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-600/30 bg-green-600/5 p-4 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Card className="rounded-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" aria-hidden="true" />
              Business
            </CardTitle>
            <CardDescription>
              Details shown in the app and on invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Business name" htmlFor="business-name">
              <Input
                id="business-name"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
              />
            </Field>
            <Field label="Logo URL or path" htmlFor="logo-url">
              <Input
                id="logo-url"
                placeholder="https://... or /logo.png"
                value={form.logo_url}
                onChange={(event) =>
                  updateForm("logo_url", event.target.value)
                }
              />
            </Field>
            <Field label="Phone" htmlFor="business-phone">
              <Input
                id="business-phone"
                value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)}
              />
            </Field>
            <Field label="Email" htmlFor="business-email">
              <Input
                id="business-email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
              />
            </Field>
            <Field label="Currency" htmlFor="business-currency">
              <Input
                id="business-currency"
                maxLength={3}
                value={form.currency}
                onChange={(event) =>
                  updateForm("currency", event.target.value)
                }
              />
            </Field>
            <Field
              label="Address"
              htmlFor="business-address"
              className="md:col-span-2"
            >
              <Input
                id="business-address"
                value={form.address}
                onChange={(event) => updateForm("address", event.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Percent className="size-4" aria-hidden="true" />
              Tax
            </CardTitle>
            <CardDescription>
              Default tax rate applies to new product setup only. Existing
              products, sales, and invoices are not changed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Default tax rate" htmlFor="default-tax-rate">
              <Input
                id="default-tax-rate"
                min="0"
                max="100"
                step="0.01"
                type="number"
                value={form.default_tax_rate}
                onChange={(event) =>
                  updateForm("default_tax_rate", event.target.value)
                }
              />
            </Field>
            <Field label="Tax label" htmlFor="tax-label">
              <Input
                id="tax-label"
                value={form.tax_label}
                onChange={(event) =>
                  updateForm("tax_label", event.target.value)
                }
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" aria-hidden="true" />
              Invoice
            </CardTitle>
            <CardDescription>
              Invoice numbering and business details for new documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Invoice prefix" htmlFor="invoice-prefix">
              <Input
                id="invoice-prefix"
                maxLength={20}
                value={form.invoice_prefix}
                onChange={(event) =>
                  updateForm("invoice_prefix", event.target.value)
                }
              />
            </Field>
            <Field label="Invoice business name" htmlFor="invoice-name">
              <Input
                id="invoice-name"
                value={form.invoice_business_name}
                onChange={(event) =>
                  updateForm("invoice_business_name", event.target.value)
                }
              />
            </Field>
            <Field
              label="Invoice business details"
              htmlFor="invoice-details"
              className="md:col-span-2"
            >
              <textarea
                id="invoice-details"
                className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={form.invoice_business_details}
                onChange={(event) =>
                  updateForm("invoice_business_details", event.target.value)
                }
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save aria-hidden="true" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </main>
  )
}

function Field({
  label,
  htmlFor,
  className = "",
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

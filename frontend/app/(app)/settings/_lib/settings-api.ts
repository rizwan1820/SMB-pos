import type {
  BusinessSettings,
  BusinessSettingsForm,
} from "@/app/(app)/settings/_lib/settings-types"

function apiUrl(endpoint: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.")
  }

  return `${baseUrl}${endpoint}`
}

async function fetchJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(endpoint), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed for ${endpoint}.`)
  }

  return response.json()
}

export function settingsToForm(
  settings: BusinessSettings
): BusinessSettingsForm {
  return {
    name: settings.name,
    logo_url: settings.logo_url ?? "",
    address: settings.address ?? "",
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    currency: settings.currency.toUpperCase(),
    default_tax_rate: String(settings.default_tax_rate),
    tax_label: settings.tax_label,
    invoice_prefix: settings.invoice_prefix,
    invoice_business_name: settings.invoice_business_name ?? "",
    invoice_business_details: settings.invoice_business_details ?? "",
  }
}

export function settingsPayload(form: BusinessSettingsForm) {
  return {
    name: form.name.trim(),
    logo_url: form.logo_url.trim() || null,
    address: form.address.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    currency: form.currency.trim().toUpperCase(),
    default_tax_rate: form.default_tax_rate,
    tax_label: form.tax_label.trim(),
    invoice_prefix: form.invoice_prefix.trim().toUpperCase(),
    invoice_business_name: form.invoice_business_name.trim() || null,
    invoice_business_details: form.invoice_business_details.trim() || null,
  }
}

export function getBusinessSettings() {
  return fetchJson<BusinessSettings>("/business/settings")
}

export function updateBusinessSettings(form: BusinessSettingsForm) {
  return fetchJson<BusinessSettings>("/business/settings", {
    method: "PATCH",
    body: JSON.stringify(settingsPayload(form)),
  })
}

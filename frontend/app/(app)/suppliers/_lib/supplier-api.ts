import type {
  Supplier,
  SupplierFormState,
} from "@/app/(app)/suppliers/_lib/supplier-types"

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

export function supplierToForm(supplier: Supplier): SupplierFormState {
  return {
    name: supplier.name,
    contact_person: supplier.contact_person,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    notes: supplier.notes ?? "",
    status: supplier.status,
  }
}

function supplierPayload(form: SupplierFormState) {
  return {
    name: form.name.trim(),
    contact_person: form.contact_person.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
    notes: form.notes.trim() || null,
    status: form.status,
  }
}

export async function getSuppliers() {
  return fetchJson<Supplier[]>("/suppliers")
}

export async function createSupplier(form: SupplierFormState) {
  const { status: _status, ...createPayload } = supplierPayload(form)

  return fetchJson<Supplier>("/suppliers", {
    method: "POST",
    body: JSON.stringify(createPayload),
  })
}

export async function updateSupplier(supplierId: string, form: SupplierFormState) {
  return fetchJson<Supplier>(`/suppliers/${supplierId}`, {
    method: "PATCH",
    body: JSON.stringify(supplierPayload(form)),
  })
}

export async function archiveSupplier(supplierId: string) {
  return fetchJson<Supplier>(`/suppliers/${supplierId}/archive`, {
    method: "PATCH",
  })
}

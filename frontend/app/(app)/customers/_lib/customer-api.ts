import type {
  Customer,
  CustomerFormState,
  CustomerProfile,
} from "@/app/(app)/customers/_lib/customer-types"

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

export function customerToForm(customer: Customer): CustomerFormState {
  return {
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    customer_type: customer.customer_type ?? "individual",
    notes: customer.notes ?? "",
    status: customer.status,
  }
}

function customerPayload(form: CustomerFormState) {
  return {
    name: form.name.trim(),
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    address: form.address.trim() || null,
    customer_type: form.customer_type,
    notes: form.notes.trim() || null,
    status: form.status,
  }
}

export async function getCustomers(search: string) {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set("search", search.trim())
  }

  const query = params.toString()

  return fetchJson<Customer[]>(`/customers${query ? `?${query}` : ""}`)
}

export async function createCustomer(form: CustomerFormState) {
  const { status: _status, ...createPayload } = customerPayload(form)

  return fetchJson<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(createPayload),
  })
}

export async function updateCustomer(customerId: string, form: CustomerFormState) {
  return fetchJson<Customer>(`/customers/${customerId}`, {
    method: "PATCH",
    body: JSON.stringify(customerPayload(form)),
  })
}

export async function archiveCustomer(customerId: string) {
  return fetchJson<Customer>(`/customers/${customerId}/archive`, {
    method: "PATCH",
  })
}

export async function getCustomerProfile(customerId: string) {
  return fetchJson<CustomerProfile>(`/customers/${customerId}/profile`)
}

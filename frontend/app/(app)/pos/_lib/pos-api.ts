import type {
  CheckoutResult,
  Customer,
  PaymentMethod,
  Product,
} from "@/app/(app)/pos/_lib/pos-types"

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

export function toMoney(value: string | number) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return "$0.00"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function toNumber(value: string | number) {
  const amount = Number(value)

  return Number.isNaN(amount) ? 0 : amount
}

export async function getPosProducts() {
  return fetchJson<Product[]>("/products")
}

export async function getPosCustomers() {
  return fetchJson<Customer[]>("/customers")
}

export async function checkout(payload: {
  customer_id: string | null
  items: Array<{ product_id: string; quantity: number }>
  discount_amount: string
  payment_method: PaymentMethod
  payment_reference: string | null
}) {
  return fetchJson<CheckoutResult>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

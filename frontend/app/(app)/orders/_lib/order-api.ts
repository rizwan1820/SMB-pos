import type {
  Customer,
  OrderDetail,
  OrderSummary,
  Product,
} from "@/app/(app)/orders/_lib/order-types"

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

export function formatMoney(value: string | number) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return "$0.00"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function shortOrderId(orderId: string) {
  return orderId.slice(0, 8)
}

export async function getOrders() {
  return fetchJson<OrderSummary[]>("/orders")
}

export async function getOrder(orderId: string) {
  return fetchJson<OrderDetail>(`/orders/${orderId}`)
}

export async function getOrderProducts() {
  return fetchJson<Product[]>("/products")
}

export async function getOrderCustomers() {
  return fetchJson<Customer[]>("/customers")
}

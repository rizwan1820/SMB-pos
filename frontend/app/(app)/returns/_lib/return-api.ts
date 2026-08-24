import type {
  MoneyValue,
  CreatedReturn,
  OrderDetail,
  OrderSummary,
  Product,
  ReturnDetail,
  ReturnPayload,
  ReturnSummary,
} from "@/app/(app)/returns/_lib/return-types"

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

export function toNumber(value: MoneyValue) {
  const amount = Number(value)

  return Number.isNaN(amount) ? 0 : amount
}

export function formatMoney(value: MoneyValue | null) {
  const amount = value === null ? Number.NaN : Number(value)

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

export function shortId(id: string) {
  return id.slice(0, 8)
}

export function getOrders() {
  return fetchJson<OrderSummary[]>("/orders")
}

export function getOrder(orderId: string) {
  return fetchJson<OrderDetail>(`/orders/${orderId}`)
}

export function getProducts() {
  return fetchJson<Product[]>("/products")
}

export function getReturns() {
  return fetchJson<ReturnSummary[]>("/returns")
}

export function getReturn(returnId: string) {
  return fetchJson<ReturnDetail>(`/returns/${returnId}`)
}

export function createReturn(payload: ReturnPayload) {
  return fetchJson<CreatedReturn>("/returns", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

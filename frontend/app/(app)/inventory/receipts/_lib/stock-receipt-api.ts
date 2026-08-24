import type {
  ProductOption,
  StockReceiptDetail,
  StockReceiptFormState,
  StockReceiptListItem,
  SupplierOption,
} from "@/app/(app)/inventory/receipts/_lib/stock-receipt-types"

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

export function formatMoney(value: string | number, currency: string) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return "-"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatQuantity(value: string | number) {
  const quantity = Number(value)

  if (Number.isNaN(quantity)) {
    return "-"
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(quantity)
}

export function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date)
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

export async function getReceiptSuppliers() {
  const suppliers = await fetchJson<SupplierOption[]>("/suppliers")

  return suppliers.filter((supplier) => supplier.status === "active")
}

export async function getReceiptProducts() {
  const products = await fetchJson<ProductOption[]>("/products")

  return products.filter((product) => product.status === "active")
}

export async function getStockReceipts() {
  return fetchJson<StockReceiptListItem[]>("/inventory/receipts")
}

export async function getStockReceipt(receiptId: string) {
  return fetchJson<StockReceiptDetail>(`/inventory/receipts/${receiptId}`)
}

export async function createStockReceipt(form: StockReceiptFormState) {
  return fetchJson<StockReceiptDetail>("/inventory/receipts", {
    method: "POST",
    body: JSON.stringify({
      supplier_id: form.supplier_id,
      receipt_date: form.receipt_date,
      reference: form.reference.trim() || null,
      notes: form.notes.trim() || null,
      items: form.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      })),
    }),
  })
}

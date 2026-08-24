import {
  InventoryAction,
  InventoryFormState,
  InventoryMovement,
  LowStockProduct,
  Product,
  StockSummary,
} from "@/app/(app)/inventory/_lib/inventory-types"

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

function movementEndpoint(action: InventoryAction) {
  if (action === "opening") {
    return "/inventory/opening-stock"
  }

  if (action === "receive") {
    return "/inventory/receive"
  }

  return "/inventory/adjust"
}

function isAdjustmentAction(action: InventoryAction) {
  return !["opening", "receive"].includes(action)
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

export async function getProducts() {
  return fetchJson<Product[]>("/products")
}

export async function getLowStockProducts() {
  return fetchJson<LowStockProduct[]>("/inventory/low-stock")
}

export async function getProductStock(productId: string) {
  return fetchJson<StockSummary>(`/inventory/products/${productId}/stock`)
}

export async function getProductMovements(productId: string) {
  return fetchJson<InventoryMovement[]>(
    `/inventory/products/${productId}/movements`
  )
}

export async function createInventoryMovement(
  action: InventoryAction,
  productId: string,
  form: InventoryFormState
) {
  const quantity = form.quantity

  return fetchJson<InventoryMovement>(movementEndpoint(action), {
    method: "POST",
    body: JSON.stringify(
      isAdjustmentAction(action)
        ? {
            product_id: productId,
            adjustment_type: action,
            quantity,
            reference: form.reference.trim() || null,
            notes: form.notes.trim() || null,
          }
        : {
            product_id: productId,
            quantity,
            reference: form.reference.trim() || null,
            notes: form.notes.trim() || null,
          }
    ),
  })
}

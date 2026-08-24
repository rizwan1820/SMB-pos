import {
  Category,
  Product,
  ProductFormState,
} from "@/app/(app)/products/_lib/product-types"

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

export function productToForm(product: Product): ProductFormState {
  return {
    category_id: product.category_id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    cost_price: String(product.cost_price),
    selling_price: String(product.selling_price),
    tax_rate: String(product.tax_rate),
    low_stock_threshold: String(product.low_stock_threshold),
    status: product.status,
  }
}

function productPayload(form: ProductFormState) {
  return {
    category_id: form.category_id,
    name: form.name.trim(),
    sku: form.sku.trim(),
    barcode: form.barcode.trim(),
    cost_price: form.cost_price,
    selling_price: form.selling_price,
    tax_rate: form.tax_rate,
    low_stock_threshold: Number(form.low_stock_threshold || 0),
    status: form.status,
  }
}

export function formatCurrency(value: string | number) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return "-"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export async function getCategories() {
  return fetchJson<Category[]>("/categories")
}

export async function createCategory(name: string) {
  return fetchJson<Category>("/categories", {
    method: "POST",
    body: JSON.stringify({ name: name.trim() }),
  })
}

export async function updateCategory(categoryId: string, name: string) {
  return fetchJson<Category>(`/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: name.trim() }),
  })
}

export async function archiveCategory(categoryId: string) {
  return fetchJson<Category>(`/categories/${categoryId}/archive`, {
    method: "PATCH",
  })
}

export async function getProducts(filters: {
  search: string
  categoryId: string
  status: string
}) {
  const params = new URLSearchParams()

  if (filters.search.trim()) {
    params.set("search", filters.search.trim())
  }

  if (filters.categoryId !== "all") {
    params.set("category_id", filters.categoryId)
  }

  if (filters.status !== "all") {
    params.set("status", filters.status)
  }

  const query = params.toString()

  return fetchJson<Product[]>(`/products${query ? `?${query}` : ""}`)
}

export async function createProduct(form: ProductFormState) {
  const { status: _status, ...createPayload } = productPayload(form)

  return fetchJson<Product>("/products", {
    method: "POST",
    body: JSON.stringify(createPayload),
  })
}

export async function updateProduct(productId: string, form: ProductFormState) {
  return fetchJson<Product>(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(productPayload(form)),
  })
}

export async function archiveProduct(productId: string) {
  return fetchJson<Product>(`/products/${productId}/archive`, {
    method: "PATCH",
  })
}

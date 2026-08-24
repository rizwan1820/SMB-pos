import type {
  CustomersReport,
  DashboardReport,
  DateRangeState,
  MoneyValue,
  ProductsReport,
  ReturnsReport,
  SalesReport,
} from "@/app/(app)/reports/_lib/report-types"

function apiUrl(endpoint: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.")
  }

  return `${baseUrl}${endpoint}`
}

function reportQuery(rangeState: DateRangeState) {
  const params = new URLSearchParams({
    range: rangeState.range,
  })

  if (rangeState.range === "custom") {
    params.set("start_date", rangeState.startDate)
    params.set("end_date", rangeState.endDate)
  }

  return params.toString()
}

async function fetchJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(apiUrl(endpoint), {
    credentials: "include",
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed for ${endpoint}.`)
  }

  return response.json()
}

export function getDashboardReport(rangeState: DateRangeState) {
  return fetchJson<DashboardReport>(
    `/reports/dashboard?${reportQuery(rangeState)}`
  )
}

export function getSalesReport(rangeState: DateRangeState) {
  return fetchJson<SalesReport>(`/reports/sales?${reportQuery(rangeState)}`)
}

export function getProductsReport(rangeState: DateRangeState) {
  return fetchJson<ProductsReport>(
    `/reports/products?${reportQuery(rangeState)}`
  )
}

export function getCustomersReport(rangeState: DateRangeState) {
  return fetchJson<CustomersReport>(
    `/reports/customers?${reportQuery(rangeState)}`
  )
}

export function getReturnsReport(rangeState: DateRangeState) {
  return fetchJson<ReturnsReport>(`/reports/returns?${reportQuery(rangeState)}`)
}

export function formatMoney(value: MoneyValue) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return "$0.00"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatQuantity(value: MoneyValue) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return "0"
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(amount)
}

export function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
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

export function shortId(id: string) {
  return id.slice(0, 8)
}

export type ReportRange =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "this_week"
  | "this_month"
  | "this_year"
  | "custom"

export type MoneyValue = string | number

export type DateRangeState = {
  range: ReportRange
  startDate: string
  endDate: string
}

export type DashboardReport = {
  total_sales: MoneyValue
  order_count: number
  total_refunds: MoneyValue
  net_sales: MoneyValue
  products_sold: MoneyValue
  average_order_value: MoneyValue
  low_stock_count: number
}

export type SalesReport = {
  sales_over_time: Array<{
    date: string
    total_sales: MoneyValue
    order_count: number
  }>
  payment_methods: Array<{
    method: string
    count: number
    amount: MoneyValue
  }>
  order_totals: Array<{
    order_id: string
    created_at: string
    total_amount: MoneyValue
    status: string
  }>
}

export type ProductsReport = {
  top_by_quantity: Array<{
    product_id: string
    name: string
    sku: string
    quantity: MoneyValue
  }>
  top_by_revenue: Array<{
    product_id: string
    name: string
    sku: string
    revenue: MoneyValue
  }>
  low_stock_products: Array<{
    product_id: string
    name: string
    sku: string
    current_stock: MoneyValue
    low_stock_threshold: number
  }>
}

export type CustomersReport = {
  top_customers_by_spend: Array<{
    customer_id: string
    name: string
    spend: MoneyValue
  }>
  customer_order_counts: Array<{
    customer_id: string
    name: string
    order_count: number
  }>
}

export type ReturnsReport = {
  refund_total: MoneyValue
  return_count: number
  daily: Array<{
    date: string
    refund_total: MoneyValue
    return_count: number
  }>
}

export type InventoryReport = {
  current_inventory: Array<{
    product_id: string
    name: string
    sku: string
    current_stock: MoneyValue
    low_stock_threshold: number
    status: string
  }>
  movement_history: Array<{
    date: string
    product_name: string
    sku: string
    movement_type: string
    quantity: MoneyValue
    reference: string | null
    notes: string | null
  }>
  inventory_value: {
    total_inventory_value: MoneyValue
    items: Array<{
      product_id: string
      name: string
      sku: string
      current_stock: MoneyValue
      cost_price: MoneyValue
      inventory_value: MoneyValue
    }>
  }
}

export type MoneyValue = string | number

export type OrderInvoice = {
  id: string
  invoice_number: string
  invoice_date: string
}

export type OrderSummary = {
  id: string
  customer_id: string | null
  total_amount: MoneyValue
  status: string
  created_at: string
  invoice?: OrderInvoice
}

export type OrderItem = {
  id: string
  product_id: string
  quantity: MoneyValue
  unit_price: MoneyValue
  discount_amount: MoneyValue
  tax_amount: MoneyValue
  line_total: MoneyValue
}

export type OrderDetail = OrderSummary & {
  subtotal: MoneyValue
  discount_amount: MoneyValue
  tax_amount: MoneyValue
  items: OrderItem[]
}

export type Product = {
  id: string
  name: string
  sku: string
}

export type ReturnSummary = {
  id: string
  order_id: string
  reason: string
  restock: boolean
  refund_amount: MoneyValue | null
  refund_method: string | null
  refund_status: string | null
  created_at: string
}

export type ReturnDetail = {
  id: string
  order_id: string
  customer_id: string | null
  reason: string
  status: string
  restock: boolean
  total_refund_amount: MoneyValue
  created_by: string
  created_at: string
  refund: {
    id: string
    method: string
    amount: MoneyValue
    status: string
    reference: string | null
    created_at: string
  }
  items: Array<{
    id: string
    order_item_id: string
    product_id: string
    quantity: MoneyValue
    unit_price: MoneyValue
    discount_amount: MoneyValue
    tax_amount: MoneyValue
    line_total: MoneyValue
  }>
  order: {
    id: string
    status: string
    subtotal: MoneyValue
    discount_amount: MoneyValue
    tax_amount: MoneyValue
    total_amount: MoneyValue
    created_at: string
  }
  invoice: OrderInvoice | null
}

export type CreatedReturn = Omit<ReturnDetail, "order" | "invoice">

export type ReturnFormItem = {
  order_item_id: string
  selected: boolean
  quantity: string
}

export type ReturnPayload = {
  order_id: string
  reason: string
  restock: boolean
  items: Array<{
    order_item_id: string
    quantity: string
  }>
  refund_method: "cash" | "card" | "other"
  refund_reference: string | null
}

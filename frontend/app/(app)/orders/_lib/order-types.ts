export type OrderSummary = {
  id: string
  customer_id: string | null
  subtotal: string | number
  discount_amount: string | number
  tax_amount: string | number
  total_amount: string | number
  status: string
  created_by: string
  created_at: string
  invoice?: OrderInvoice
}

export type OrderInvoice = {
  id: string
  invoice_number: string
  invoice_date: string
}

export type OrderItem = {
  id: string
  product_id: string
  quantity: string | number
  unit_price: string | number
  discount_amount: string | number
  tax_amount: string | number
  line_total: string | number
}

export type OrderPayment = {
  id: string
  method: string
  amount: string | number
  status: string
  reference: string | null
  created_at: string
}

export type OrderDetail = OrderSummary & {
  items: OrderItem[]
  payment?: OrderPayment
}

export type Product = {
  id: string
  name: string
  sku: string
}

export type Customer = {
  id: string
  name: string
}

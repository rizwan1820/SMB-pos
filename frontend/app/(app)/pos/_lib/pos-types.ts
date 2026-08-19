export type Product = {
  id: string
  name: string
  sku: string
  selling_price: string | number
  tax_rate: string | number
  status: string
}

export type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
}

export type CartItem = {
  product: Product
  quantity: number
}

export type PaymentMethod = "cash" | "card" | "other"

export type CheckoutResult = {
  message: string
  order_id: string
  subtotal: string | number
  discount_amount: string | number
  tax_amount: string | number
  total_amount: string | number
  payment: {
    method: string
    amount: string | number
    status: string
  }
}

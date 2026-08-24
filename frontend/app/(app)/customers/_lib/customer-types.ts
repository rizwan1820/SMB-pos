export type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  customer_type: "individual" | "business"
  notes: string | null
  status: string
}

export type CustomerFormState = {
  name: string
  phone: string
  email: string
  address: string
  customer_type: "individual" | "business"
  notes: string
  status: string
}

export const emptyCustomerForm: CustomerFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  customer_type: "individual",
  notes: "",
  status: "active",
}

export const customerStatusOptions = ["active", "inactive", "archived"]
export const customerTypeOptions = ["individual", "business"] as const

export type CustomerProfile = {
  customer: Customer
  summary: {
    total_orders: number
    total_spend: string | number
    last_purchase_date: string | null
  }
  orders: CustomerProfileOrder[]
  returns: CustomerProfileReturn[]
}

export type CustomerProfileOrder = {
  order_id: string
  created_at: string
  status: string
  subtotal: string | number
  discount_amount: string | number
  tax_amount: string | number
  total_amount: string | number
  payment_method: string | null
  payment_status: string | null
  invoice_id: string | null
  invoice_number: string | null
}

export type CustomerProfileReturn = {
  return_id: string
  order_id: string
  created_at: string
  reason: string
  status: string
  restock: boolean
  total_refund_amount: string | number
  refund_method: string | null
  refund_status: string | null
  refund_reference: string | null
  refund_amount: string | number | null
}

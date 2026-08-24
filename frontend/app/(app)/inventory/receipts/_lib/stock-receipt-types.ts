export type SupplierOption = {
  id: string
  name: string
  status: string
}

export type ProductOption = {
  id: string
  name: string
  sku: string
  status: string
}

export type StockReceiptFormItem = {
  product_id: string
  quantity: string
  unit_cost: string
}

export type StockReceiptFormState = {
  supplier_id: string
  receipt_date: string
  reference: string
  notes: string
  items: StockReceiptFormItem[]
}

export type StockReceiptListItem = {
  id: string
  supplier_id: string
  supplier_name: string
  receipt_date: string
  reference: string | null
  total_cost: string | number
  status: string
  created_at: string
}

export type StockReceiptDetailItem = {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  quantity: string | number
  unit_cost: string | number
  line_total: string | number
}

export type StockReceiptDetail = {
  id: string
  supplier: {
    id: string
    name: string
    contact_person: string | null
    phone: string | null
    email: string | null
  }
  receipt_date: string
  reference: string | null
  notes: string | null
  total_cost: string | number
  status: string
  created_by: string
  created_by_name: string | null
  created_at: string
  updated_at: string
  items: StockReceiptDetailItem[]
}

export const emptyReceiptItem: StockReceiptFormItem = {
  product_id: "",
  quantity: "",
  unit_cost: "",
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

export const emptyReceiptForm: StockReceiptFormState = {
  supplier_id: "",
  receipt_date: todayDate(),
  reference: "",
  notes: "",
  items: [{ ...emptyReceiptItem }],
}

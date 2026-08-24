export type Product = {
  id: string
  name: string
  sku: string
  status: string
  low_stock_threshold: number
}

export type StockSummary = {
  product_id: string
  current_stock: string | number
}

export type InventoryMovement = {
  movement_type: string
  quantity: string | number
  reference: string | null
  notes: string | null
  created_at: string
}

export type LowStockProduct = {
  id: string
  name: string
  sku: string
  current_stock: string | number
  low_stock_threshold: number
}

export type InventoryAction =
  | "opening"
  | "receive"
  | "adjustment_in"
  | "adjustment_out"
  | "damaged"
  | "lost"

export type InventoryFormState = {
  quantity: string
  reference: string
  notes: string
}

export const emptyInventoryForm: InventoryFormState = {
  quantity: "",
  reference: "",
  notes: "",
}

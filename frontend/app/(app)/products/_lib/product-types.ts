export type Product = {
  id: string
  category_id: string
  name: string
  sku: string
  barcode: string
  cost_price: string | number
  selling_price: string | number
  tax_rate: string | number
  status: string
  low_stock_threshold: number
}

export type Category = {
  id: string
  name: string
  status?: string
}

export type ProductFormState = {
  category_id: string
  name: string
  sku: string
  barcode: string
  cost_price: string
  selling_price: string
  tax_rate: string
  low_stock_threshold: string
  status: string
}

export const emptyProductForm: ProductFormState = {
  category_id: "",
  name: "",
  sku: "",
  barcode: "",
  cost_price: "",
  selling_price: "",
  tax_rate: "0",
  low_stock_threshold: "0",
  status: "active",
}

export const productStatusOptions = ["active", "inactive", "archived"]

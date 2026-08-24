export type BusinessSettings = {
  id: string
  name: string
  logo_url: string | null
  address: string | null
  phone: string | null
  email: string | null
  currency: string
  default_tax_rate: string | number
  tax_label: string
  invoice_prefix: string
  invoice_business_name: string | null
  invoice_business_details: string | null
}

export type BusinessSettingsForm = {
  name: string
  logo_url: string
  address: string
  phone: string
  email: string
  currency: string
  default_tax_rate: string
  tax_label: string
  invoice_prefix: string
  invoice_business_name: string
  invoice_business_details: string
}

export const emptyBusinessSettingsForm: BusinessSettingsForm = {
  name: "",
  logo_url: "",
  address: "",
  phone: "",
  email: "",
  currency: "USD",
  default_tax_rate: "0",
  tax_label: "Tax",
  invoice_prefix: "INV",
  invoice_business_name: "",
  invoice_business_details: "",
}

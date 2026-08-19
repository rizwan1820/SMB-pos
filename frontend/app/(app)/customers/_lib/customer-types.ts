export type Customer = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  status: string
}

export type CustomerFormState = {
  name: string
  phone: string
  email: string
  address: string
  status: string
}

export const emptyCustomerForm: CustomerFormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  status: "active",
}

export const customerStatusOptions = ["active", "inactive", "archived"]

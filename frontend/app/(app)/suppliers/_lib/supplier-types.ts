export type Supplier = {
  id: string
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  status: string
}

export type SupplierFormState = {
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  status: string
}

export const emptySupplierForm: SupplierFormState = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  status: "active",
}

export const supplierStatusOptions = ["active", "inactive", "archived"]

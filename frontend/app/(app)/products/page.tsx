"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { PackagePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProductFilters } from "@/app/(app)/products/_components/product-filters"
import { ProductFormDialog } from "@/app/(app)/products/_components/product-form-dialog"
import { ProductTable } from "@/app/(app)/products/_components/product-table"
import {
  archiveProduct,
  createProduct,
  getCategories,
  getProducts,
  productToForm,
  updateProduct,
} from "@/app/(app)/products/_lib/product-api"
import {
  Category,
  emptyProductForm,
  Product,
  ProductFormState,
} from "@/app/(app)/products/_lib/product-types"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [status, setStatus] = useState("active")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyProductForm)

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  )

  async function loadProducts() {
    setLoading(true)
    setError(null)

    try {
      const data = await getProducts({ search, categoryId, status })

      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadCategories() {
      try {
        const data = await getCategories()

        if (active) {
          setCategories(data)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load categories."
          )
        }
      }
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadProducts()
    }, 250)

    return () => window.clearTimeout(handle)
  }, [search, categoryId, status])

  function openAddForm() {
    setEditingProduct(null)
    setForm({ ...emptyProductForm, category_id: categories[0]?.id ?? "" })
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setForm(productToForm(product))
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, form)
      } else {
        await createProduct(form)
      }

      setFormOpen(false)
      await loadProducts()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save product."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleArchiveProduct(product: Product) {
    setArchivingId(product.id)
    setError(null)

    try {
      await archiveProduct(product.id)
      await loadProducts()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to archive product."
      )
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage catalog pricing, categories, and selling status.
          </p>
        </div>
        <Button onClick={openAddForm}>
          <PackagePlus aria-hidden="true" />
          Add Product
        </Button>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Catalog</CardTitle>
          <CardDescription>
            Filter products by name, SKU, category, or status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProductFilters
            categories={categories}
            search={search}
            categoryId={categoryId}
            status={status}
            onSearchChange={setSearch}
            onCategoryChange={setCategoryId}
            onStatusChange={setStatus}
          />

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <ProductTable
            products={products}
            categoryNameById={categoryNameById}
            loading={loading}
            archivingId={archivingId}
            onEdit={openEditForm}
            onArchive={handleArchiveProduct}
          />
        </CardContent>
      </Card>

      {formOpen ? (
        <ProductFormDialog
          categories={categories}
          editingProduct={editingProduct}
          form={form}
          formError={formError}
          saving={saving}
          onFormChange={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </main>
  )
}

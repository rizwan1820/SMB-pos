"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
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
  archiveCategory,
  archiveProduct,
  createCategory,
  createProduct,
  getCategories,
  getProducts,
  productToForm,
  updateCategory,
  updateProduct,
} from "@/app/(app)/products/_lib/product-api"
import { CategoryManager } from "@/app/(app)/products/_components/category-manager"
import {
  Category,
  emptyProductForm,
  Product,
  ProductFormState,
} from "@/app/(app)/products/_lib/product-types"
import { getBusinessSettings } from "@/app/(app)/settings/_lib/settings-api"

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [status, setStatus] = useState("active")
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [categorySavingId, setCategorySavingId] = useState<string | null>(null)
  const [categoryCreating, setCategoryCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyProductForm)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)

    return () => window.clearTimeout(handle)
  }, [search])

  const productsQuery = useQuery({
    queryKey: ["products", { search: debouncedSearch, categoryId, status }],
    queryFn: () => getProducts({ search: debouncedSearch, categoryId, status }),
  })
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })
  const settingsQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: getBusinessSettings,
  })

  const products = productsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const defaultTaxRate = String(
    settingsQuery.data?.default_tax_rate ?? emptyProductForm.tax_rate
  )
  const error =
    actionError ??
    (productsQuery.error instanceof Error ? productsQuery.error.message : null) ??
    (categoriesQuery.error instanceof Error
      ? categoriesQuery.error.message
      : null)
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  )

  async function invalidateProductData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["pos", "products"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] }),
      queryClient.invalidateQueries({ queryKey: ["orders", "products"] }),
      queryClient.invalidateQueries({ queryKey: ["returns", "products"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
    ])
  }

  function openAddForm() {
    setEditingProduct(null)
    setForm({
      ...emptyProductForm,
      category_id: categories[0]?.id ?? "",
      tax_rate: defaultTaxRate,
    })
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

    if (saving) {
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, form)
      } else {
        await createProduct(form)
      }

      setFormOpen(false)
      await invalidateProductData()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save product."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleArchiveProduct(product: Product) {
    if (archivingId) {
      return
    }

    setArchivingId(product.id)
    setActionError(null)

    try {
      await archiveProduct(product.id)
      await invalidateProductData()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to archive product."
      )
    } finally {
      setArchivingId(null)
    }
  }

  async function handleCreateCategory(name: string) {
    setCategoryCreating(true)
    setActionError(null)

    try {
      await createCategory(name)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ])
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to create category."
      )
    } finally {
      setCategoryCreating(false)
    }
  }

  async function handleUpdateCategory(category: Category, name: string) {
    setCategorySavingId(category.id)
    setActionError(null)

    try {
      await updateCategory(category.id, name)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ])
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to update category."
      )
    } finally {
      setCategorySavingId(null)
    }
  }

  async function handleArchiveCategory(category: Category) {
    setCategorySavingId(category.id)
    setActionError(null)

    try {
      await archiveCategory(category.id)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ])
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to archive category."
      )
    } finally {
      setCategorySavingId(null)
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
            loading={productsQuery.isLoading}
            archivingId={archivingId}
            onEdit={openEditForm}
            onArchive={handleArchiveProduct}
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage product category names and archive unused categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager
            categories={categories}
            savingId={categorySavingId}
            creating={categoryCreating}
            onCreate={handleCreateCategory}
            onUpdate={handleUpdateCategory}
            onArchive={handleArchiveCategory}
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

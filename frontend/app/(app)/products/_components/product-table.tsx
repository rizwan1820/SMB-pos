"use client"

import { Archive, Edit, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/app/(app)/products/_lib/product-api"
import { Product } from "@/app/(app)/products/_lib/product-types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ProductTableProps = {
  products: Product[]
  categoryNameById: Map<string, string>
  loading: boolean
  archivingId: string | null
  onEdit: (product: Product) => void
  onArchive: (product: Product) => void
}

export function ProductTable({
  products,
  categoryNameById,
  loading,
  archivingId,
  onEdit,
  onArchive,
}: ProductTableProps) {
  const [productToArchive, setProductToArchive] = useState<Product | null>(null)
  return (
    <>
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Cost Price</th>
              <th className="px-4 py-3 text-right font-medium">
                Selling Price
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading products...
                  </span>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No products match the current filters.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="bg-card">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3">
                    {categoryNameById.get(product.category_id) ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(product.cost_price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(product.selling_price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Edit ${product.name}`}
                        onClick={() => onEdit(product)}
                      >
                        <Edit aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        aria-label={`Archive ${product.name}`}
                        disabled={
                          product.status === "archived" ||
                          archivingId === product.id
                        }
                        onClick={() => setProductToArchive(product)}
                      >
                        {archivingId === product.id ? (
                          <Loader2 className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Archive aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    <AlertDialog
  open={productToArchive !== null}
  onOpenChange={(open) => {
    if (!open) {
      setProductToArchive(null)
    }
  }}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        Archive product?
      </AlertDialogTitle>

      <AlertDialogDescription>
        Are you sure you want to archive{" "}
        <strong>{productToArchive?.name}</strong>?
        The product will no longer be active, but its historical
        records will remain available.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>
        Cancel
      </AlertDialogCancel>

      <AlertDialogAction
        onClick={() => {
          if (!productToArchive) return

          onArchive(productToArchive)
          setProductToArchive(null)
        }}
      >
        Archive Product
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
</>
  )
}

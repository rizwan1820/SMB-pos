"use client"

import { Archive, Edit, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Supplier } from "@/app/(app)/suppliers/_lib/supplier-types"

type SupplierTableProps = {
  suppliers: Supplier[]
  loading: boolean
  archivingId: string | null
  onEdit: (supplier: Supplier) => void
  onArchive: (supplier: Supplier) => void
}

export function SupplierTable({
  suppliers,
  loading,
  archivingId,
  onEdit,
  onArchive,
}: SupplierTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact Person</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Notes</th>
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
                    Loading suppliers...
                  </span>
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No suppliers have been added yet.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="bg-card">
                  <td className="px-4 py-3 font-medium">{supplier.name}</td>
                  <td className="px-4 py-3">{supplier.contact_person}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.phone}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.email}
                  </td>
                  <td className="max-w-52 truncate px-4 py-3 text-muted-foreground">
                    {supplier.notes ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Edit ${supplier.name}`}
                        onClick={() => onEdit(supplier)}
                      >
                        <Edit aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        aria-label={`Archive ${supplier.name}`}
                        disabled={
                          supplier.status === "archived" ||
                          archivingId === supplier.id
                        }
                        onClick={() => onArchive(supplier)}
                      >
                        {archivingId === supplier.id ? (
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
  )
}

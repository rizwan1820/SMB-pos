"use client"

import Link from "next/link"
import { Archive, Edit, Eye, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Customer } from "@/app/(app)/customers/_lib/customer-types"

type CustomerTableProps = {
  customers: Customer[]
  loading: boolean
  archivingId: string | null
  onEdit: (customer: Customer) => void
  onArchive: (customer: Customer) => void
}

export function CustomerTable({
  customers,
  loading,
  archivingId,
  onEdit,
  onArchive,
}: CustomerTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading customers...
                  </span>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No customers match the current search.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="bg-card">
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {customer.phone ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {customer.email ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
                        aria-label={`View ${customer.name} profile`}
                      >
                        <Eye aria-hidden="true" className="size-3.5" />
                      </Link>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Edit ${customer.name}`}
                        onClick={() => onEdit(customer)}
                      >
                        <Edit aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="destructive"
                        aria-label={`Archive ${customer.name}`}
                        disabled={
                          customer.status === "archived" ||
                          archivingId === customer.id
                        }
                        onClick={() => onArchive(customer)}
                      >
                        {archivingId === customer.id ? (
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

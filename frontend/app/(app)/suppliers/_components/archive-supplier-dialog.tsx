"use client"

import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Supplier } from "@/app/(app)/suppliers/_lib/supplier-types"

type ArchiveSupplierDialogProps = {
  supplier: Supplier
  archiving: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ArchiveSupplierDialog({
  supplier,
  archiving,
  onCancel,
  onConfirm,
}: ArchiveSupplierDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-lg">
        <CardHeader>
          <CardTitle>Archive Supplier</CardTitle>
          <CardDescription>
            Archive {supplier.name}? This keeps the supplier record available
            for history while removing it from active purchasing workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={archiving}
              onClick={onConfirm}
            >
              {archiving ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              Archive
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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
import type { Customer } from "@/app/(app)/customers/_lib/customer-types"

type ArchiveCustomerDialogProps = {
  customer: Customer
  archiving: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ArchiveCustomerDialog({
  customer,
  archiving,
  onCancel,
  onConfirm,
}: ArchiveCustomerDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md rounded-lg">
        <CardHeader>
          <CardTitle>Archive Customer</CardTitle>
          <CardDescription>
            Archive {customer.name}? This keeps the record but removes it from
            active customer workflows.
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

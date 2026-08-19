"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

type CustomerSearchProps = {
  search: string
  onSearchChange: (value: string) => void
}

export function CustomerSearch({
  search,
  onSearchChange,
}: CustomerSearchProps) {
  return (
    <div className="relative max-w-xl">
      <Search
        className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        className="pl-8"
        placeholder="Search by name, phone, or email"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
  )
}

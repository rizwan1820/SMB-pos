"use client"

import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Column<T> = {
  header: string
  className?: string
  cell: (row: T) => ReactNode
}

type ReportTableProps<T> = {
  title: string
  description: string
  columns: Column<T>[]
  rows: T[]
  emptyText: string
}

export function ReportTable<T>({
  title,
  description,
  columns,
  rows,
  emptyText,
}: ReportTableProps<T>) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.header}
                      className={`px-4 py-3 font-medium ${
                        column.className ?? ""
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      {emptyText}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={index} className="bg-card">
                      {columns.map((column) => (
                        <td
                          key={column.header}
                          className={`px-4 py-3 ${column.className ?? ""}`}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

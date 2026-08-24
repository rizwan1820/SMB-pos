"use client"

import { useQuery } from "@tanstack/react-query"
import type { ComponentType, SVGProps } from "react"
import { useState } from "react"
import {
  BadgeDollarSign,
  PackageSearch,
  Boxes,
  RotateCcw,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CustomersSection } from "@/app/(app)/reports/_components/customers-section"
import { DateRangeFilter } from "@/app/(app)/reports/_components/date-range-filter"
import { InventorySection } from "@/app/(app)/reports/_components/inventory-section"
import { ProductsSection } from "@/app/(app)/reports/_components/products-section"
import { ReturnsSection } from "@/app/(app)/reports/_components/returns-section"
import { SalesSection } from "@/app/(app)/reports/_components/sales-section"
import {
  getCustomersReport,
  getInventoryReport,
  getProductsReport,
  getReturnsReport,
  getSalesReport,
} from "@/app/(app)/reports/_lib/report-api"
import type {
  CustomersReport,
  DateRangeState,
  InventoryReport,
  ProductsReport,
  ReturnsReport,
  SalesReport,
} from "@/app/(app)/reports/_lib/report-types"

type ReportTab = "sales" | "products" | "inventory" | "customers" | "returns"
type ReportResult =
  | SalesReport
  | ProductsReport
  | InventoryReport
  | CustomersReport
  | ReturnsReport

const today = new Date().toISOString().slice(0, 10)

const tabs: Array<{
  value: ReportTab
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}> = [
  { value: "sales", label: "Sales", icon: BadgeDollarSign },
  { value: "products", label: "Products", icon: PackageSearch },
  { value: "inventory", label: "Inventory", icon: Boxes },
  { value: "customers", label: "Customers", icon: Users },
  { value: "returns", label: "Returns", icon: RotateCcw },
]

export default function ReportsPage() {
  const [rangeState, setRangeState] = useState<DateRangeState>({
    range: "today",
    startDate: today,
    endDate: today,
  })
  const [activeTab, setActiveTab] = useState<ReportTab>("sales")
  const hasValidRange =
    rangeState.range !== "custom" ||
    Boolean(rangeState.startDate && rangeState.endDate)
  const reportQuery = useQuery<ReportResult>({
    queryKey: [
      "reports",
      activeTab,
      activeTab === "inventory" ? "current" : rangeState,
    ],
    queryFn: () => {
      if (activeTab === "sales") {
        return getSalesReport(rangeState)
      }

      if (activeTab === "products") {
        return getProductsReport(rangeState)
      }

      if (activeTab === "inventory") {
        return getInventoryReport()
      }

      if (activeTab === "customers") {
        return getCustomersReport(rangeState)
      }

      return getReturnsReport(rangeState)
    },
    enabled: activeTab === "inventory" || hasValidRange,
  })
  const activeReport = reportQuery.data ?? null
  const error =
    reportQuery.error instanceof Error ? reportQuery.error.message : null

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review Phase 1 sales, product, customer, and return reports.
        </p>
      </div>

      <DateRangeFilter value={rangeState} onChange={setRangeState} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <Button
              key={tab.value}
              type="button"
              variant={activeTab === tab.value ? "default" : "outline"}
              onClick={() => setActiveTab(tab.value)}
            >
              <Icon aria-hidden="true" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {error ? (
        <Card className="rounded-lg border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>Report unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!activeReport && reportQuery.isLoading ? (
        <div className="grid gap-4">
          <Card className="min-h-52 animate-pulse rounded-lg" />
          <Card className="min-h-52 animate-pulse rounded-lg" />
        </div>
      ) : null}

      {activeTab === "sales" && activeReport ? (
        <SalesSection report={activeReport as SalesReport} />
      ) : null}

      {activeTab === "products" && activeReport ? (
        <ProductsSection report={activeReport as ProductsReport} />
      ) : null}

      {activeTab === "inventory" && activeReport ? (
        <InventorySection report={activeReport as InventoryReport} />
      ) : null}

      {activeTab === "customers" && activeReport ? (
        <CustomersSection report={activeReport as CustomersReport} />
      ) : null}

      {activeTab === "returns" && activeReport ? (
        <ReturnsSection report={activeReport as ReturnsReport} />
      ) : null}
    </main>
  )
}

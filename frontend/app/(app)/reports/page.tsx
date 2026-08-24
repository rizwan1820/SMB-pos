"use client"

import type { ComponentType, SVGProps } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  BadgeDollarSign,
  PackageSearch,
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
import { ProductsSection } from "@/app/(app)/reports/_components/products-section"
import { ReturnsSection } from "@/app/(app)/reports/_components/returns-section"
import { SalesSection } from "@/app/(app)/reports/_components/sales-section"
import {
  getCustomersReport,
  getProductsReport,
  getReturnsReport,
  getSalesReport,
} from "@/app/(app)/reports/_lib/report-api"
import type {
  CustomersReport,
  DateRangeState,
  ProductsReport,
  ReturnsReport,
  SalesReport,
} from "@/app/(app)/reports/_lib/report-types"

type ReportTab = "sales" | "products" | "customers" | "returns"

type ReportData = {
  sales: SalesReport | null
  products: ProductsReport | null
  customers: CustomersReport | null
  returns: ReturnsReport | null
}

const today = new Date().toISOString().slice(0, 10)

const tabs: Array<{
  value: ReportTab
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}> = [
  { value: "sales", label: "Sales", icon: BadgeDollarSign },
  { value: "products", label: "Products", icon: PackageSearch },
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
  const [data, setData] = useState<ReportData>({
    sales: null,
    products: null,
    customers: null,
    returns: null,
  })
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rangeKey = useMemo(() => JSON.stringify(rangeState), [rangeState])
  const activeKey = `${activeTab}:${rangeKey}`

  useEffect(() => {
    setData({
      sales: null,
      products: null,
      customers: null,
      returns: null,
    })
    setLoadedKeys(new Set())
    setError(null)
  }, [rangeKey])

  useEffect(() => {
    let active = true

    async function loadReport() {
      if (
        rangeState.range === "custom" &&
        (!rangeState.startDate || !rangeState.endDate)
      ) {
        return
      }

      if (loadedKeys.has(activeKey)) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        if (activeTab === "sales") {
          const sales = await getSalesReport(rangeState)
          if (active) {
            setData((current) => ({ ...current, sales }))
          }
        }

        if (activeTab === "products") {
          const products = await getProductsReport(rangeState)
          if (active) {
            setData((current) => ({ ...current, products }))
          }
        }

        if (activeTab === "customers") {
          const customers = await getCustomersReport(rangeState)
          if (active) {
            setData((current) => ({ ...current, customers }))
          }
        }

        if (activeTab === "returns") {
          const returns = await getReturnsReport(rangeState)
          if (active) {
            setData((current) => ({ ...current, returns }))
          }
        }

        if (active) {
          setLoadedKeys((current) => new Set(current).add(activeKey))
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load report."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadReport()

    return () => {
      active = false
    }
  }, [activeKey, activeTab, loadedKeys, rangeState])

  const activeReport = loadedKeys.has(activeKey) ? data[activeTab] : null

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

      {!activeReport && (loading || !loadedKeys.has(activeKey)) ? (
        <div className="grid gap-4">
          <Card className="min-h-52 animate-pulse rounded-lg" />
          <Card className="min-h-52 animate-pulse rounded-lg" />
        </div>
      ) : null}

      {!loading && activeTab === "sales" && activeReport ? (
        <SalesSection report={activeReport as SalesReport} />
      ) : null}

      {!loading && activeTab === "products" && activeReport ? (
        <ProductsSection report={activeReport as ProductsReport} />
      ) : null}

      {!loading && activeTab === "customers" && activeReport ? (
        <CustomersSection report={activeReport as CustomersReport} />
      ) : null}

      {!loading && activeTab === "returns" && activeReport ? (
        <ReturnsSection report={activeReport as ReturnsReport} />
      ) : null}
    </main>
  )
}

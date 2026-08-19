"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Package, Truck, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DashboardCounts = {
  products: number
  lowStock: number
  customers: number
  suppliers: number
}

type MetricCard = {
  title: string
  value: number
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

async function fetchArray(endpoint: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.")
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`Failed to load ${endpoint}.`)
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    throw new Error(`Unexpected response from ${endpoint}.`)
  }

  return data
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<DashboardCounts>({
    products: 0,
    lowStock: 0,
    customers: 0,
    suppliers: 0,
  })

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const [products, lowStock, customers, suppliers] = await Promise.all([
          fetchArray("/products"),
          fetchArray("/inventory/low-stock"),
          fetchArray("/customers"),
          fetchArray("/suppliers"),
        ])

        if (!active) {
          return
        }

        setCounts({
          products: products.length,
          lowStock: lowStock.length,
          customers: customers.length,
          suppliers: suppliers.length,
        })
      } catch (err) {
        if (!active) {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data."
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  const metricCards: MetricCard[] = [
    {
      title: "Total Products",
      value: counts.products,
      description: "Products available in the catalog",
      icon: Package,
    },
    {
      title: "Low Stock",
      value: counts.lowStock,
      description: "Items that need attention",
      icon: AlertTriangle,
    },
    {
      title: "Customers",
      value: counts.customers,
      description: "Customer records on file",
      icon: Users,
    },
    {
      title: "Suppliers",
      value: counts.suppliers,
      description: "Active supplier records",
      icon: Truck,
    },
  ]

  if (loading) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Loading store activity...
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <Card key={card.title} className="min-h-36 animate-pulse">
              <CardHeader>
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-9 w-16 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your store overview and daily operating signals.
          </p>
        </div>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>Dashboard unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your store overview and daily operating signals.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon

          return (
            <Card key={card.title} className="min-h-36">
              <CardHeader className="grid-cols-[1fr_auto]">
                <div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">
                  {card.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </main>
  )
}

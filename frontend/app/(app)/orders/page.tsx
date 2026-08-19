"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OrderDetailPanel } from "@/app/(app)/orders/_components/order-detail-panel"
import { OrdersTable } from "@/app/(app)/orders/_components/orders-table"
import {
  getOrder,
  getOrderCustomers,
  getOrderProducts,
  getOrders,
} from "@/app/(app)/orders/_lib/order-api"
import type {
  Customer,
  OrderDetail,
  OrderSummary,
  Product,
} from "@/app/(app)/orders/_lib/order-types"

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  )
  const customerNameById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers]
  )

  useEffect(() => {
    let active = true

    async function loadOrders() {
      setLoading(true)
      setError(null)

      try {
        const [orderData, productData, customerData] = await Promise.all([
          getOrders(),
          getOrderProducts(),
          getOrderCustomers(),
        ])

        if (!active) {
          return
        }

        setOrders(orderData)
        setProducts(productData)
        setCustomers(customerData)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load orders.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      active = false
    }
  }, [])

  async function selectOrder(order: OrderSummary) {
    setSelectedOrderId(order.id)
    setSelectedOrder(null)
    setDetailLoading(true)
    setDetailError(null)

    try {
      const detail = await getOrder(order.id)

      setSelectedOrder(detail)
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Unable to load order detail."
      )
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review completed checkout history and backend-confirmed totals.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <Card className="rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              Newest orders appear first. Select an order to inspect details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersTable
              orders={orders}
              customerNameById={customerNameById}
              selectedOrderId={selectedOrderId}
              loading={loading}
              onSelectOrder={selectOrder}
            />
          </CardContent>
        </Card>

        <Card className="h-fit rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Order Detail</CardTitle>
            <CardDescription>
              Financial values come from the checkout backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderDetailPanel
              order={selectedOrder}
              customerNameById={customerNameById}
              productNameById={productNameById}
              loading={detailLoading}
              error={detailError}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

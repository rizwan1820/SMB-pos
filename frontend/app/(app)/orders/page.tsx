"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

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
import type { OrderSummary } from "@/app/(app)/orders/_lib/order-types"

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const ordersQuery = useQuery({ queryKey: ["orders"], queryFn: getOrders })
  const productsQuery = useQuery({
    queryKey: ["orders", "products"],
    queryFn: getOrderProducts,
  })
  const customersQuery = useQuery({
    queryKey: ["orders", "customers"],
    queryFn: getOrderCustomers,
  })
  const orderDetailQuery = useQuery({
    queryKey: ["orders", "detail", selectedOrderId],
    queryFn: () => getOrder(selectedOrderId as string),
    enabled: Boolean(selectedOrderId),
  })

  const orders = ordersQuery.data ?? []
  const products = productsQuery.data ?? []
  const customers = customersQuery.data ?? []
  const selectedOrder = orderDetailQuery.data ?? null
  const error =
    (ordersQuery.error instanceof Error ? ordersQuery.error.message : null) ??
    (productsQuery.error instanceof Error ? productsQuery.error.message : null) ??
    (customersQuery.error instanceof Error ? customersQuery.error.message : null)
  const detailError =
    orderDetailQuery.error instanceof Error ? orderDetailQuery.error.message : null

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  )
  const customerNameById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers]
  )

  async function selectOrder(order: OrderSummary) {
    setSelectedOrderId(order.id)
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
              loading={ordersQuery.isLoading}
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
              loading={orderDetailQuery.isLoading}
              error={detailError}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ReturnCreatePanel } from "@/app/(app)/returns/_components/return-create-panel"
import { ReturnDetailPanel } from "@/app/(app)/returns/_components/return-detail-panel"
import { ReturnsHistoryTable } from "@/app/(app)/returns/_components/returns-history-table"
import {
  createReturn,
  getOrder,
  getOrders,
  getProducts,
  getReturn,
  getReturns,
  formatMoney,
  toNumber,
} from "@/app/(app)/returns/_lib/return-api"
import type {
  OrderDetail,
  OrderSummary,
  Product,
  ReturnDetail,
  ReturnFormItem,
  ReturnPayload,
  ReturnSummary,
} from "@/app/(app)/returns/_lib/return-types"

type RefundMethod = "cash" | "card" | "other"

export default function ReturnsPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [returns, setReturns] = useState<ReturnSummary[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [formItems, setFormItems] = useState<ReturnFormItem[]>([])
  const [returnedQuantityByOrderItemId, setReturnedQuantityByOrderItemId] =
    useState<Map<string, number>>(new Map())
  const [reason, setReason] = useState("")
  const [restock, setRestock] = useState(true)
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("cash")
  const [refundReference, setRefundReference] = useState("")
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<ReturnDetail | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  )

  useEffect(() => {
    let active = true

    async function loadInitialData() {
      setLoading(true)
      setError(null)

      try {
        const [orderData, productData, returnData] = await Promise.all([
          getOrders(),
          getProducts(),
          getReturns(),
        ])

        if (!active) {
          return
        }

        setOrders(orderData)
        setProducts(productData)
        setReturns(returnData)
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load returns."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      active = false
    }
  }, [])

  async function refreshReturns() {
    const returnData = await getReturns()
    setReturns(returnData)
    return returnData
  }

  async function loadReturnedQuantities(orderId: string) {
    const relevantReturns = returns.filter(
      (returnSummary) => returnSummary.order_id === orderId
    )
    const details = await Promise.all(
      relevantReturns.map((returnSummary) => getReturn(returnSummary.id))
    )
    const quantityByItemId = new Map<string, number>()

    for (const detail of details) {
      for (const item of detail.items) {
        quantityByItemId.set(
          item.order_item_id,
          (quantityByItemId.get(item.order_item_id) ?? 0) +
            toNumber(item.quantity)
        )
      }
    }

    setReturnedQuantityByOrderItemId(quantityByItemId)
  }

  async function selectOrder(orderId: string) {
    setSelectedOrderId(orderId)
    setSelectedOrder(null)
    setFormItems([])
    setReturnedQuantityByOrderItemId(new Map())
    setFormError(null)
    setSuccess(null)

    if (!orderId) {
      return
    }

    setLoadingOrder(true)

    try {
      const order = await getOrder(orderId)
      setSelectedOrder(order)
      setFormItems(
        order.items.map((item) => ({
          order_item_id: item.id,
          selected: false,
          quantity: "",
        }))
      )
      await loadReturnedQuantities(orderId)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to load order detail."
      )
    } finally {
      setLoadingOrder(false)
    }
  }

  function toggleItem(orderItemId: string, selected: boolean) {
    setFormItems((currentItems) =>
      currentItems.map((item) =>
        item.order_item_id === orderItemId
          ? { ...item, selected, quantity: selected ? item.quantity || "1" : "" }
          : item
      )
    )
  }

  function changeQuantity(orderItemId: string, quantity: string) {
    setFormItems((currentItems) =>
      currentItems.map((item) =>
        item.order_item_id === orderItemId ? { ...item, quantity } : item
      )
    )
  }

  function validatePayload(): ReturnPayload | null {
    if (!selectedOrder) {
      setFormError("Select an order before creating a return.")
      return null
    }

    if (!reason.trim()) {
      setFormError("Return reason is required.")
      return null
    }

    const selectedItems = formItems.filter((item) => item.selected)

    if (selectedItems.length === 0) {
      setFormError("Select at least one item to return.")
      return null
    }

    const orderItemById = new Map(
      selectedOrder.items.map((item) => [item.id, item])
    )

    for (const item of selectedItems) {
      const orderItem = orderItemById.get(item.order_item_id)
      const requestedQuantity = Number(item.quantity)
      const purchasedQuantity = toNumber(orderItem?.quantity ?? 0)
      const alreadyReturned =
        returnedQuantityByOrderItemId.get(item.order_item_id) ?? 0
      const remainingQuantity = Math.max(
        purchasedQuantity - alreadyReturned,
        0
      )

      if (!orderItem || Number.isNaN(requestedQuantity)) {
        setFormError("Return quantity is invalid.")
        return null
      }

      if (requestedQuantity <= 0) {
        setFormError("Return quantity must be greater than 0.")
        return null
      }

      if (requestedQuantity > remainingQuantity) {
        setFormError("Return quantity cannot exceed remaining quantity.")
        return null
      }
    }

    return {
      order_id: selectedOrder.id,
      reason: reason.trim(),
      restock,
      items: selectedItems.map((item) => ({
        order_item_id: item.order_item_id,
        quantity: item.quantity,
      })),
      refund_method: refundMethod,
      refund_reference: refundReference.trim() || null,
    }
  }

  async function submitReturn() {
    if (submitting) {
      return
    }

    const payload = validatePayload()

    if (!payload) {
      return
    }

    setSubmitting(true)
    setFormError(null)
    setSuccess(null)

    try {
      const createdReturn = await createReturn(payload)
      const refreshedReturns = await refreshReturns()
      const createdReturnDetail = await getReturn(createdReturn.id)

      setSelectedOrderId("")
      setSelectedOrder(null)
      setFormItems([])
      setReturnedQuantityByOrderItemId(new Map())
      setReason("")
      setRestock(true)
      setRefundMethod("cash")
      setRefundReference("")
      setSelectedReturnId(createdReturn.id)
      setSelectedReturn(createdReturnDetail)
      setSuccess(
        `Return completed. Refund amount: ${formatMoney(
          createdReturn.total_refund_amount
        )}`
      )
      setReturns(refreshedReturns)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Return could not be completed."
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function selectReturn(returnSummary: ReturnSummary) {
    setSelectedReturnId(returnSummary.id)
    setSelectedReturn(null)
    setLoadingReturn(true)
    setDetailError(null)

    try {
      const detail = await getReturn(returnSummary.id)
      setSelectedReturn(detail)
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Unable to load return detail."
      )
    } finally {
      setLoadingReturn(false)
    }
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Returns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Process completed-order returns and review refund history.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-600/30 bg-green-600/5 p-4 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Create Return</CardTitle>
          <CardDescription>
            Backend return processing calculates all refund amounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formError ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
          <ReturnCreatePanel
            orders={orders}
            order={selectedOrder}
            productNameById={productNameById}
            selectedOrderId={selectedOrderId}
            formItems={formItems}
            returnedQuantityByOrderItemId={returnedQuantityByOrderItemId}
            reason={reason}
            restock={restock}
            refundMethod={refundMethod}
            refundReference={refundReference}
            loadingOrder={loadingOrder}
            submitting={submitting}
            onOrderChange={selectOrder}
            onToggleItem={toggleItem}
            onQuantityChange={changeQuantity}
            onReasonChange={setReason}
            onRestockChange={setRestock}
            onRefundMethodChange={setRefundMethod}
            onRefundReferenceChange={setRefundReference}
            onSubmit={submitReturn}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <Card className="rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Return History</CardTitle>
            <CardDescription>
              Newest returns appear first. Select one for detail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReturnsHistoryTable
              returns={returns}
              selectedReturnId={selectedReturnId}
              loading={loading}
              onSelectReturn={selectReturn}
            />
          </CardContent>
        </Card>

        <Card className="h-fit rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Return Detail</CardTitle>
            <CardDescription>
              Refund and item values come from the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReturnDetailPanel
              returnDetail={selectedReturn}
              productNameById={productNameById}
              loading={loadingReturn}
              error={detailError}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

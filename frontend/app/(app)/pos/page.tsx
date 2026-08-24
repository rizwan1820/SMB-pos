"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CartPanel } from "@/app/(app)/pos/_components/cart-panel"
import { CheckoutSummary } from "@/app/(app)/pos/_components/checkout-summary"
import { ProductPicker } from "@/app/(app)/pos/_components/product-picker"
import {
  checkout,
  getPosCustomers,
  getPosProducts,
  toNumber,
} from "@/app/(app)/pos/_lib/pos-api"
import type {
  CartItem,
  CheckoutResult,
  Customer,
  PaymentMethod,
  Product,
} from "@/app/(app)/pos/_lib/pos-types"

export default function PosPage() {
  const queryClient = useQueryClient()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [discountAmount, setDiscountAmount] = useState("0")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [paymentReference, setPaymentReference] = useState("")
  const [processing, setProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(
    null
  )

  const productsQuery = useQuery({
    queryKey: ["pos", "products"],
    queryFn: getPosProducts,
  })
  const customersQuery = useQuery({
    queryKey: ["pos", "customers"],
    queryFn: getPosCustomers,
  })
  const products = (productsQuery.data ?? []).filter(
    (product) => product.status !== "archived"
  )
  const customers = (customersQuery.data ?? []).filter(
    (customer) => customer.status !== "archived"
  )
  const loading = productsQuery.isLoading || customersQuery.isLoading
  const error =
    (productsQuery.error instanceof Error ? productsQuery.error.message : null) ??
    (customersQuery.error instanceof Error ? customersQuery.error.message : null)

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) =>
        sum + toNumber(item.product.selling_price) * item.quantity,
      0
    )
    const discount = Math.min(toNumber(discountAmount), subtotal)
    const taxAmount = cartItems.reduce((sum, item) => {
      const lineSubtotal = toNumber(item.product.selling_price) * item.quantity
      const lineDiscount =
        subtotal > 0 && discount > 0
          ? discount * (lineSubtotal / subtotal)
          : 0
      const taxableAmount = Math.max(lineSubtotal - lineDiscount, 0)

      return sum + taxableAmount * (toNumber(item.product.tax_rate) / 100)
    }, 0)

    return {
      subtotal,
      taxAmount,
      totalAmount: Math.max(subtotal - discount + taxAmount, 0),
    }
  }, [cartItems, discountAmount])

  function addProduct(product: Product) {
    setCheckoutResult(null)
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.product.id === product.id
      )

      if (!existingItem) {
        return [...currentItems, { product, quantity: 1 }]
      }

      return currentItems.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    })
  }

  function increaseQuantity(productId: string) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  function decreaseQuantity(productId: string) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeItem(productId: string) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId)
    )
  }

  async function handleCheckout() {
    if (processing || cartItems.length === 0) {
      return
    }

    setProcessing(true)
    setCheckoutError(null)
    setCheckoutResult(null)

    try {
      const result = await checkout({
        customer_id: selectedCustomerId || null,
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        discount_amount: discountAmount || "0",
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim() || null,
      })

      setCheckoutResult(result)
      setCartItems([])
      setSelectedCustomerId("")
      setDiscountAmount("0")
      setPaymentReference("")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["pos", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["returns", "orders"] }),
      ])
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Checkout could not be completed."
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">POS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ring up sales, choose a customer, and send checkout to the backend.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {checkoutResult ? <CheckoutSummary result={checkoutResult} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Search products and click to add them to the cart.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductPicker
              products={products}
              search={productSearch}
              loading={loading}
              onSearchChange={setProductSearch}
              onAddProduct={addProduct}
            />
          </CardContent>
        </Card>

        <Card className="h-fit rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Cart</CardTitle>
            <CardDescription>
              Backend checkout remains authoritative for final totals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkoutError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {checkoutError}
              </div>
            ) : null}

            <CartPanel
              cartItems={cartItems}
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              discountAmount={discountAmount}
              paymentMethod={paymentMethod}
              paymentReference={paymentReference}
              subtotal={totals.subtotal}
              taxAmount={totals.taxAmount}
              totalAmount={totals.totalAmount}
              processing={processing}
              onCustomerChange={setSelectedCustomerId}
              onDiscountChange={setDiscountAmount}
              onPaymentMethodChange={setPaymentMethod}
              onPaymentReferenceChange={setPaymentReference}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              onRemove={removeItem}
              onCheckout={handleCheckout}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

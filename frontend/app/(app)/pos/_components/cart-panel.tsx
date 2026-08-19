"use client"

import { Minus, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toMoney } from "@/app/(app)/pos/_lib/pos-api"
import type {
  CartItem,
  Customer,
  PaymentMethod,
} from "@/app/(app)/pos/_lib/pos-types"

type CartPanelProps = {
  cartItems: CartItem[]
  customers: Customer[]
  selectedCustomerId: string
  discountAmount: string
  paymentMethod: PaymentMethod
  paymentReference: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  processing: boolean
  onCustomerChange: (value: string) => void
  onDiscountChange: (value: string) => void
  onPaymentMethodChange: (value: PaymentMethod) => void
  onPaymentReferenceChange: (value: string) => void
  onIncrease: (productId: string) => void
  onDecrease: (productId: string) => void
  onRemove: (productId: string) => void
  onCheckout: () => void
}

export function CartPanel({
  cartItems,
  customers,
  selectedCustomerId,
  discountAmount,
  paymentMethod,
  paymentReference,
  subtotal,
  taxAmount,
  totalAmount,
  processing,
  onCustomerChange,
  onDiscountChange,
  onPaymentMethodChange,
  onPaymentReferenceChange,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: CartPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {cartItems.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Add products to start a sale.
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.product.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.product.sku} · {toMoney(item.product.selling_price)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${item.product.name}`}
                  onClick={() => onRemove(item.product.id)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Decrease ${item.product.name}`}
                    onClick={() => onDecrease(item.product.id)}
                  >
                    <Minus aria-hidden="true" />
                  </Button>
                  <span className="w-10 text-center text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Increase ${item.product.name}`}
                    onClick={() => onIncrease(item.product.id)}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                </div>
                <p className="font-medium tabular-nums">
                  {toMoney(Number(item.product.selling_price) * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <select
            id="customer"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={selectedCustomerId}
            onChange={(event) => onCustomerChange(event.target.value)}
          >
            <option value="">Walk-in customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount">Discount amount</Label>
          <Input
            id="discount"
            min="0"
            step="0.01"
            type="number"
            value={discountAmount}
            onChange={(event) => onDiscountChange(event.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment method</Label>
            <select
              id="payment-method"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={paymentMethod}
              onChange={(event) =>
                onPaymentMethodChange(event.target.value as PaymentMethod)
              }
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-reference">Payment reference</Label>
            <Input
              id="payment-reference"
              value={paymentReference}
              onChange={(event) => onPaymentReferenceChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estimated subtotal</span>
          <span className="tabular-nums">{toMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estimated tax</span>
          <span className="tabular-nums">{toMoney(taxAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Estimated total</span>
          <span className="tabular-nums">{toMoney(totalAmount)}</span>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={cartItems.length === 0 || processing}
        onClick={onCheckout}
      >
        {processing ? "Processing..." : "Checkout"}
      </Button>
    </div>
  )
}

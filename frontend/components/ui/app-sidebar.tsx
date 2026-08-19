"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingCart,
  ReceiptText,
} from "lucide-react"

export function AppSidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r bg-background p-4">
      <div className="mb-8">
        <h2 className="text-xl font-semibold">SMB POS</h2>
        <p className="text-sm text-muted-foreground">
          Business Management
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          href="/products"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
        >
          <Package size={18} />
          Products
        </Link>

        <Link
          href="/pos"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
        >
          <ShoppingCart size={18} />
          POS
        </Link>

        <Link
          href="/orders"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
        >
          <ReceiptText size={18} />
          Orders
        </Link>

        <Link
          href="/inventory"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
        >
          <Boxes size={18} />
          Inventory
        </Link>

        <Link
          href="/customers"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
        >
          <Users size={18} />
          Customers
        </Link>

        <Link
          href="/suppliers"
          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted"
        >
          <Truck size={18} />
          Suppliers
        </Link>
      </nav>
    </aside>
  )
}

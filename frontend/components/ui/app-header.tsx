"use client"

import { Loader2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function AppHeader({
  userName,
}: {
  userName: string
}) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (!response.ok) {
        setLoggingOut(false)
        return
      }

      router.push("/login")
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Business Workspace
        </p>
      </div>

      <div className="flex items-center gap-2">
        <User size={18} />

        <span className="text-sm font-medium">
          {userName}
        </span>

        <Button onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : null}
          Logout
        </Button>
      </div>
    </header>
  )
}

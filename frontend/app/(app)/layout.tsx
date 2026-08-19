"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { AppHeader } from "@/components/ui/app-header"

type AppUser = {
  name: string
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AppUser | null>(null)

  useEffect(() => {
    let active = true

    async function checkAuth() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/me`,
          {
            credentials: "include",
          }
        )

        if (!response.ok) {
          router.push("/login")
          return
        }

        const data = await response.json()

        if (active) {
          setUser(data)
          setLoading(false)
        }
      } catch {
        router.push("/login")
      }
    }

    checkAuth()

    return () => {
      active = false
    }
  }, [router])

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <div className="flex flex-1 flex-col">
        <AppHeader userName={user?.name ?? "User"} />

        <main className="flex-1 bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

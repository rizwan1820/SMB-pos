"use client"

import { FormEvent, useEffect, useState } from "react"
import { Building2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Business = {
  id: string
  name: string
  status: string
  email: string | null
  phone: string | null
  created_at: string
}

type BusinessUser = {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
  created_at: string
}

function apiUrl(endpoint: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.")
  }

  return `${baseUrl}${endpoint}`
}

async function fetchJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(endpoint), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed for ${endpoint}.`)
  }

  return response.json()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value))
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  )
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([])
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadBusinesses() {
    const data = await fetchJson<Business[]>("/businesses")

    setBusinesses(data)
  }

  useEffect(() => {
    let active = true

    async function loadInitial() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchJson<Business[]>("/businesses")

        if (active) {
          setBusinesses(data)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load businesses."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitial()

    return () => {
      active = false
    }
  }, [])

  async function selectBusiness(businessId: string) {
    setDetailLoading(true)
    setError(null)

    try {
      const [business, users] = await Promise.all([
        fetchJson<Business>(`/businesses/${businessId}`),
        fetchJson<BusinessUser[]>(`/businesses/${businessId}/users`),
      ])

      setSelectedBusiness(business)
      setBusinessUsers(users)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load business detail."
      )
    } finally {
      setDetailLoading(false)
    }
  }

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving || !newName.trim()) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const business = await fetchJson<Business>("/businesses", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      })

      setNewName("")
      setSuccess("Business created.")
      await loadBusinesses()
      await selectBusiness(business.id)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create business."
      )
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(business: Business, status: string) {
    if (statusChangingId) {
      return
    }

    const confirmed = window.confirm(
      `Change ${business.name} status to ${status}?`
    )

    if (!confirmed) {
      return
    }

    setStatusChangingId(business.id)
    setError(null)
    setSuccess(null)

    try {
      await fetchJson<Business>(`/businesses/${business.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      setSuccess("Business status updated.")
      await loadBusinesses()
      await selectBusiness(business.id)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status."
      )
    } finally {
      setStatusChangingId(null)
    }
  }

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Platform Admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage businesses and inspect tenant users.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Businesses</CardTitle>
            <CardDescription>Create and manage business status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="flex gap-2" onSubmit={createBusiness}>
              <Input
                value={newName}
                placeholder="Business name"
                onChange={(event) => setNewName(event.target.value)}
              />
              <Button type="submit" disabled={saving || !newName.trim()}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Create
              </Button>
            </form>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center">
                        Loading businesses...
                      </td>
                    </tr>
                  ) : businesses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center">
                        No businesses have been created yet.
                      </td>
                    </tr>
                  ) : (
                    businesses.map((business) => (
                      <tr key={business.id}>
                        <td className="px-4 py-3 font-medium">
                          {business.name}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {business.status}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(business.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => selectBusiness(business.id)}
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={statusChangingId === business.id}
                              onClick={() =>
                                changeStatus(
                                  business,
                                  business.status === "active"
                                    ? "inactive"
                                    : "active"
                                )
                              }
                            >
                              {business.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={
                                business.status === "archived" ||
                                statusChangingId === business.id
                              }
                              onClick={() => changeStatus(business, "archived")}
                            >
                              Archive
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Business Detail</CardTitle>
            <CardDescription>Selected business and users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading detail...
              </div>
            ) : selectedBusiness ? (
              <>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    <p className="font-medium">{selectedBusiness.name}</p>
                  </div>
                  <p className="mt-2 text-sm capitalize text-muted-foreground">
                    {selectedBusiness.status}
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">User</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {businessUsers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-8 text-center">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        businessUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-3 py-2">{user.name}</td>
                            <td className="px-3 py-2">{user.role ?? "-"}</td>
                            <td className="px-3 py-2 capitalize">
                              {user.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Select a business to view details.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      if (!response.ok) {
        setError("Invalid email or password.")
        return
      }

      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        credentials: "include",
      })

      if (meResponse.ok) {
        router.push("/dashboard")
        return
      }

      setError("Unable to verify your session.")
    } catch {
      setError("Unable to sign in. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sign in to continue to your POS workspace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  required
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : null}
                Login
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

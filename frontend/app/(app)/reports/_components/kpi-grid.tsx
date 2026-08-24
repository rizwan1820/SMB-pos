"use client"

import type { ComponentType, SVGProps } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type KpiCard = {
  title: string
  value: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

type KpiGridProps = {
  cards: KpiCard[]
  loading?: boolean
}

export function KpiGrid({ cards, loading = false }: KpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.title} className="min-h-32 rounded-lg">
            <CardHeader className="grid-cols-[1fr_auto]">
              <div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
              <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums">
                  {card.value}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

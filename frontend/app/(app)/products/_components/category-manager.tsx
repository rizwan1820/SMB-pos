"use client"

import { FormEvent, useState } from "react"
import { Archive, Edit, Loader2, Plus, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Category } from "@/app/(app)/products/_lib/product-types"

type CategoryManagerProps = {
  categories: Category[]
  savingId: string | null
  creating: boolean
  onCreate: (name: string) => Promise<void>
  onUpdate: (category: Category, name: string) => Promise<void>
  onArchive: (category: Category) => Promise<void>
}

export function CategoryManager({
  categories,
  savingId,
  creating,
  onCreate,
  onUpdate,
  onArchive,
}: CategoryManagerProps) {
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newName.trim()) {
      return
    }

    await onCreate(newName)
    setNewName("")
  }

  async function handleUpdate(category: Category) {
    if (!editingName.trim()) {
      return
    }

    await onUpdate(category, editingName)
    setEditingId(null)
    setEditingName("")
  }

  async function confirmArchive(category: Category) {
    const confirmed = window.confirm(`Archive ${category.name}?`)

    if (confirmed) {
      await onArchive(category)
    }
  }

  return (
    <div className="space-y-4">
      <form className="flex gap-2" onSubmit={handleCreate}>
        <Input
          value={newName}
          placeholder="New category name"
          onChange={(event) => setNewName(event.target.value)}
        />
        <Button type="submit" disabled={creating || !newName.trim()}>
          {creating ? <Loader2 className="animate-spin" /> : <Plus />}
          Add
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No categories have been added yet.
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const isEditing = editingId === category.id
                const isSaving = savingId === category.id

                return (
                  <tr key={category.id} className="bg-card">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={editingName}
                          onChange={(event) =>
                            setEditingName(event.target.value)
                          }
                        />
                      ) : (
                        <span className="font-medium">{category.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                        {category.status ?? "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              aria-label={`Save ${category.name}`}
                              disabled={isSaving}
                              onClick={() => handleUpdate(category)}
                            >
                              {isSaving ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Save />
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Cancel category edit"
                              onClick={() => {
                                setEditingId(null)
                                setEditingName("")
                              }}
                            >
                              <X />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              aria-label={`Edit ${category.name}`}
                              onClick={() => {
                                setEditingId(category.id)
                                setEditingName(category.name)
                              }}
                            >
                              <Edit />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="destructive"
                              aria-label={`Archive ${category.name}`}
                              disabled={
                                category.status === "archived" || isSaving
                              }
                              onClick={() => confirmArchive(category)}
                            >
                              {isSaving ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Archive />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * @file categories-page-client.tsx
 * @description
 * Client component that provides a UI for viewing, creating, updating, and deleting
 * categories. It receives the user's current categories and the server actions
 * (`onAddCategory`, `onEditCategory`, `onRemoveCategory`) as props.
 *
 * Key features:
 * - Displays a list of existing categories in a table or list format
 * - Adds a "New Category" form for creating a category
 * - Inline editing for category names, plus a "Save" and "Cancel" button
 * - Delete button for removing a category
 *
 * @dependencies
 * - React: for state management, transitions
 * - Shadcn UI components: Button, Input, etc.
 * - Tailwind for styling
 *
 * @notes
 * - Uses React's startTransition for concurrency control with server actions
 * - Must handle both success and error states
 * - Could be expanded to use a modal for editing if desired, but this example
 *   does inline editing for simplicity
 */

"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useState, useTransition } from "react"

import type { SelectCategory } from "@/db/schema/categories-schema"
import type { ActionState } from "@/types"

interface CategoriesPageClientProps {
  /**
   * @property {SelectCategory[]} initialCategories
   * The categories loaded from the server for this user.
   */
  initialCategories: SelectCategory[]

  /**
   * @property {Function} onAddCategory
   * Server action for adding a new category, receiving the category name.
   */
  onAddCategory: (categoryName: string) => Promise<ActionState<SelectCategory>>

  /**
   * @property {Function} onEditCategory
   * Server action for updating a category name, receiving (categoryId, newName).
   */
  onEditCategory: (
    categoryId: string,
    newName: string
  ) => Promise<ActionState<SelectCategory>>

  /**
   * @property {Function} onRemoveCategory
   * Server action for deleting a category, receiving the categoryId.
   */
  onRemoveCategory: (categoryId: string) => Promise<ActionState<void>>
}

/**
 * @function CategoriesPageClient
 * @description
 * This component renders a list of user categories and provides forms for
 * creating, editing, and deleting those categories.
 */
export default function CategoriesPageClient({
  initialCategories,
  onAddCategory,
  onEditCategory,
  onRemoveCategory
}: CategoriesPageClientProps) {
  const [categories, setCategories] =
    useState<SelectCategory[]>(initialCategories)
  const [isPending, startTransition] = useTransition()

  // State for creating a new category
  const [newCatName, setNewCatName] = useState<string>("")

  // State for editing categories
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  )
  const [editingName, setEditingName] = useState<string>("")

  /**
   * @function handleCreateCategory
   * @description
   * Invokes the server action to create a new category, then updates local state on success.
   */
  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) {
      toast({ title: "Please enter a category name.", variant: "destructive" })
      return
    }

    startTransition(async () => {
      const res = await onAddCategory(newCatName.trim())
      if (res.isSuccess) {
        setCategories(prev => [res.data, ...prev])
        setNewCatName("")
        toast({ title: "Category created!", description: newCatName.trim() })
      } else {
        toast({
          title: "Failed to create category.",
          description: res.message,
          variant: "destructive"
        })
      }
    })
  }

  /**
   * @function handleEditClick
   * @description
   * Sets up the inline editing state for a given category.
   */
  function handleEditClick(categoryId: string, name: string) {
    setEditingCategoryId(categoryId)
    setEditingName(name)
  }

  /**
   * @function handleSaveEdit
   * @description
   * Calls the server action to update the category name, updates local state if successful.
   */
  function handleSaveEdit(categoryId: string) {
    if (!editingName.trim()) {
      toast({ title: "Name cannot be empty.", variant: "destructive" })
      return
    }

    startTransition(async () => {
      const res = await onEditCategory(categoryId, editingName.trim())
      if (res.isSuccess) {
        setCategories(prev =>
          prev.map(cat =>
            cat.id === categoryId ? { ...cat, name: res.data.name } : cat
          )
        )
        setEditingCategoryId(null)
        setEditingName("")
        toast({ title: "Category updated!", description: res.data.name })
      } else {
        toast({
          title: "Failed to update category.",
          description: res.message,
          variant: "destructive"
        })
      }
    })
  }

  /**
   * @function handleCancelEdit
   * @description
   * Resets the editing state if the user cancels editing.
   */
  function handleCancelEdit() {
    setEditingCategoryId(null)
    setEditingName("")
  }

  /**
   * @function handleDeleteCategory
   * @description
   * Calls the server action to delete a category, removing it from local state on success.
   */
  function handleDeleteCategory(categoryId: string) {
    startTransition(async () => {
      const res = await onRemoveCategory(categoryId)
      if (res.isSuccess) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId))
        toast({ title: "Category removed." })
      } else {
        toast({
          title: "Failed to delete category.",
          description: res.message,
          variant: "destructive"
        })
      }
    })
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Manage Categories</h1>

      {/* New category form */}
      <form
        onSubmit={handleCreateCategory}
        className="mb-8 flex max-w-lg flex-col gap-2 sm:flex-row"
      >
        <div className="flex flex-col sm:flex-1">
          <Label htmlFor="newCategory">New Category</Label>
          <Input
            id="newCategory"
            placeholder="e.g. Meals"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="mt-4 sm:ml-2 sm:mt-auto">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Add"}
          </Button>
        </div>
      </form>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">No categories yet.</p>
      ) : (
        <table className="w-full min-w-[500px] border text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Category Name</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b">
                <td className="p-2">
                  {editingCategoryId === cat.id ? (
                    <Input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      disabled={isPending}
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td className="p-2">
                  {editingCategoryId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSaveEdit(cat.id)}
                      >
                        {isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleEditClick(cat.id, cat.name)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

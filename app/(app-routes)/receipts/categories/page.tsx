/**
 * @file page.tsx
 * @description
 * Server component for the `/receipts/categories` route. Responsible for:
 * 1. Validating user authentication (via Clerk).
 * 2. Fetching the user's categories from the database.
 * 3. Defining server actions to create, update, and delete categories.
 * 4. Rendering a client component (`CategoriesPageClient`) that manages the interactive UI.
 *
 * Key features:
 * - Reads userId from Clerk's auth() to fetch or modify user-specific category data.
 * - getCategoriesAction: retrieves the categories belonging to the user.
 * - addCategoryAction, editCategoryAction, removeCategoryAction: server actions wrapping
 *   the existing CRUD logic in categories-actions.ts.
 *
 * @dependencies
 * - Clerk's auth for user authentication.
 * - getCategoriesAction, createCategoryAction, updateCategoryAction, deleteCategoryAction from "@/actions/db/categories-actions".
 * - Suspense for fallback if you want a lazy load, though minimal here.
 *
 * @notes
 * - If the user is not signed in, we redirect to /login.
 * - We pass the categories and the server action wrappers to the client component for interactive CRUD.
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import {
  createCategoryAction,
  deleteCategoryAction,
  getCategoriesAction,
  updateCategoryAction
} from "@/actions/db/categories-actions"
import type { SelectCategory } from "@/db/schema/categories-schema"
import { ActionState } from "@/types"

import CategoriesPageClient from "./_components/categories-page-client"

/**
 * @function addCategoryAction
 * @async
 * @description
 * A server action that calls createCategoryAction to add a new category for this user.
 *
 * @param {string} categoryName - The user-defined name for the new category.
 * @returns {Promise<ActionState<SelectCategory>>}
 *  - Success or failure, along with the created category if successful.
 */
export async function addCategoryAction(
  categoryName: string
): Promise<ActionState<SelectCategory>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "You must be signed in." }
    }

    return await createCategoryAction({ userId, name: categoryName })
  } catch (error: any) {
    console.error("Error in addCategoryAction:", error)
    return {
      isSuccess: false,
      message: error?.message || "Failed to create category."
    }
  }
}

/**
 * @function editCategoryAction
 * @async
 * @description
 * A server action that calls updateCategoryAction to edit a category's name.
 *
 * @param {string} categoryId - The ID of the category to update.
 * @param {string} newName - The new name for the category.
 * @returns {Promise<ActionState<SelectCategory>>}
 *  - Success or failure, with the updated category if successful.
 */
export async function editCategoryAction(
  categoryId: string,
  newName: string
): Promise<ActionState<SelectCategory>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "You must be signed in." }
    }

    return await updateCategoryAction(categoryId, { name: newName }, userId)
  } catch (error: any) {
    console.error("Error in editCategoryAction:", error)
    return {
      isSuccess: false,
      message: error?.message || "Failed to update category."
    }
  }
}

/**
 * @function removeCategoryAction
 * @async
 * @description
 * A server action that calls deleteCategoryAction to remove a category.
 *
 * @param {string} categoryId - The ID of the category to remove.
 * @returns {Promise<ActionState<void>>}
 *  - Success or failure, no data on success.
 */
export async function removeCategoryAction(
  categoryId: string
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "You must be signed in." }
    }

    return await deleteCategoryAction(categoryId, userId)
  } catch (error: any) {
    console.error("Error in removeCategoryAction:", error)
    return {
      isSuccess: false,
      message: error?.message || "Failed to delete category."
    }
  }
}

/**
 * @function CategoriesPage
 * @async
 * @description
 * The main server component for managing categories. It:
 * 1. Checks if the user is authenticated.
 * 2. Fetches all categories for the user.
 * 3. Renders a Suspense boundary (optional) and the client component.
 *
 * @returns {JSX.Element} The rendered layout.
 */
export default async function CategoriesPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  const categoriesResult = await getCategoriesAction(userId)
  if (!categoriesResult.isSuccess) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold">Error loading categories</h2>
        <p className="text-muted-foreground">{categoriesResult.message}</p>
      </div>
    )
  }

  const categories = categoriesResult.data

  return (
    <Suspense fallback={<div className="p-4">Loading categories...</div>}>
      <CategoriesPageClient
        initialCategories={categories}
        onAddCategory={addCategoryAction}
        onEditCategory={editCategoryAction}
        onRemoveCategory={removeCategoryAction}
      />
    </Suspense>
  )
}

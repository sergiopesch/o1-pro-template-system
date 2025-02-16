/**
 * @file categories-actions.ts
 * @description
 * This file implements server actions for performing CRUD operations on
 * the `categoriesTable`. These actions allow the creation, retrieval,
 * updating, and deletion of category records.
 *
 * Key Features:
 * - Create, read, update, and delete categories linked to a specific user.
 * - Ensures proper error handling with success/fail states.
 * - Only the user who owns the category can modify or delete it.
 *
 * @dependencies
 * - db (Drizzle ORM instance) for executing queries.
 * - categoriesTable (schema definition for categories).
 * - eq, and from drizzle-orm for building filter conditions.
 * - ActionState type for consistent return structure.
 *
 * @notes
 * - Each action uses the `userId` to ensure that only the owner's categories are accessed.
 * - On updates, partial fields are allowed to accommodate incremental editing.
 * - Deletion is permanent but can be customized to set categoryId=null in receipts if needed.
 */

"use server"

import { db } from "@/db/db"
import {
  categoriesTable,
  InsertCategory,
  SelectCategory
} from "@/db/schema/categories-schema"
import { ActionState } from "@/types"
import { and, eq } from "drizzle-orm"

/**
 * @function createCategoryAction
 * @async
 * @description
 * Creates a new category record in the database.
 *
 * @param {InsertCategory} categoryData - The data for the new category (must include userId, name).
 * @returns {Promise<ActionState<SelectCategory>>}
 *  - isSuccess: true, and the newly inserted category on success.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const newCategory: InsertCategory = {
 *   userId: "user_123",
 *   name: "Meals"
 * }
 * const result = await createCategoryAction(newCategory)
 * if (result.isSuccess) {
 *   console.log("Created category:", result.data)
 * } else {
 *   console.error("Error:", result.message)
 * }
 */
export async function createCategoryAction(
  categoryData: InsertCategory
): Promise<ActionState<SelectCategory>> {
  try {
    const [newCategory] = await db
      .insert(categoriesTable)
      .values(categoryData)
      .returning()

    return {
      isSuccess: true,
      message: "Category created successfully.",
      data: newCategory
    }
  } catch (error) {
    console.error("Error creating category:", error)
    return { isSuccess: false, message: "Failed to create category." }
  }
}

/**
 * @function getCategoriesAction
 * @async
 * @description
 * Retrieves all categories belonging to a specific user.
 *
 * @param {string} userId - The ID of the user who owns the categories.
 * @returns {Promise<ActionState<SelectCategory[]>>}
 *  - isSuccess: true, and an array of matching categories on success.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const result = await getCategoriesAction("user_123")
 * if (result.isSuccess) {
 *   console.log("User's categories:", result.data)
 * } else {
 *   console.error("Error:", result.message)
 * }
 */
export async function getCategoriesAction(
  userId: string
): Promise<ActionState<SelectCategory[]>> {
  try {
    const categories = await db.query.categories.findMany({
      where: eq(categoriesTable.userId, userId)
    })

    return {
      isSuccess: true,
      message: "Categories retrieved successfully.",
      data: categories
    }
  } catch (error) {
    console.error("Error retrieving categories:", error)
    return { isSuccess: false, message: "Failed to retrieve categories." }
  }
}

/**
 * @function updateCategoryAction
 * @async
 * @description
 * Updates an existing category record with partial data. Only fields
 * specified in `data` will be updated.
 *
 * @param {string} categoryId - The UUID of the category to update.
 * @param {Partial<InsertCategory>} data - The partial category data to update.
 * @param {string} userId - The ID of the user who owns the category.
 * @returns {Promise<ActionState<SelectCategory>>}
 *  - isSuccess: true, and the updated category on success.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const result = await updateCategoryAction("category_abc", { name: "Transportation" }, "user_123")
 * if (result.isSuccess) {
 *   console.log("Updated category:", result.data)
 * } else {
 *   console.error("Error:", result.message)
 * }
 */
export async function updateCategoryAction(
  categoryId: string,
  data: Partial<InsertCategory>,
  userId: string
): Promise<ActionState<SelectCategory>> {
  try {
    const [updatedCategory] = await db
      .update(categoriesTable)
      .set(data)
      .where(
        and(
          eq(categoriesTable.id, categoryId),
          eq(categoriesTable.userId, userId)
        )
      )
      .returning()

    if (!updatedCategory) {
      return {
        isSuccess: false,
        message: "Category not found or you don't have permission to update it."
      }
    }

    return {
      isSuccess: true,
      message: "Category updated successfully.",
      data: updatedCategory
    }
  } catch (error) {
    console.error("Error updating category:", error)
    return { isSuccess: false, message: "Failed to update category." }
  }
}

/**
 * @function deleteCategoryAction
 * @async
 * @description
 * Deletes a category record identified by `categoryId` for the specified user.
 *
 * @param {string} categoryId - The UUID of the category to delete.
 * @param {string} userId - The ID of the user who owns the category.
 * @returns {Promise<ActionState<void>>}
 *  - isSuccess: true on successful deletion.
 *  - isSuccess: false, and an error message on failure.
 *
 * @example
 * const result = await deleteCategoryAction("category_abc", "user_123")
 * if (result.isSuccess) {
 *   console.log("Category deleted.")
 * } else {
 *   console.error("Error:", result.message)
 * }
 */
export async function deleteCategoryAction(
  categoryId: string,
  userId: string
): Promise<ActionState<void>> {
  try {
    const deleted = await db
      .delete(categoriesTable)
      .where(
        and(
          eq(categoriesTable.id, categoryId),
          eq(categoriesTable.userId, userId)
        )
      )
      .returning()

    if (deleted.length === 0) {
      return {
        isSuccess: false,
        message: "Category not found or you don't have permission to delete it."
      }
    }

    return {
      isSuccess: true,
      message: "Category deleted successfully.",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting category:", error)
    return { isSuccess: false, message: "Failed to delete category." }
  }
}

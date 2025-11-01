import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { categories, categoryOptionValues, hostelOptions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allCategories = await db.select().from(categories);

    const categoriesWithOptions = await Promise.all(
      allCategories.map(async (category) => {
        const options = await db
          .select()
          .from(categoryOptionValues)
          .where(eq(categoryOptionValues.categoryId, category.categoryId));

        return {
          categoryId: category.categoryId,
          categoryName: category.category,
          options: options.map((option) => ({
            optionId: option.optionId,
            optionName: option.optionName,
          })),
        };
      })
    );

    return NextResponse.json(categoriesWithOptions);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { categoryName, options } = await req.json();

    const [newCategory] = await db
      .insert(categories)
      .values({ category: categoryName })
      .returning({ categoryId: categories.categoryId });

    if (options && options.length > 0) {
      for (const option of options) {
        await db.insert(categoryOptionValues).values({
          optionName: typeof option === "string" ? option : option.optionName,
          categoryId: newCategory.categoryId,
        });
      }
    }

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error adding category:", error);
    return NextResponse.json(
      { message: "Failed to add category." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { categoryId, categoryName, options } = await req.json();

    if (!categoryId || !categoryName) {
      return NextResponse.json(
        { message: "Category ID and name are required for update." },
        { status: 400 }
      );
    }

    const [updatedCategory] = await db
      .update(categories)
      .set({ category: categoryName })
      .where(eq(categories.categoryId, categoryId))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    const optionsToProcess = Array.isArray(options) ? options : [];

    if (optionsToProcess.length > 0) {
      await db.delete(hostelOptions).where(eq(hostelOptions.categoryId, categoryId));
      await db.delete(categoryOptionValues).where(eq(categoryOptionValues.categoryId, categoryId));

      const optionsToInsert = optionsToProcess
        .filter((opt) => opt.optionName)
        .map((opt) => ({ optionName: opt.optionName, categoryId }));

      if (optionsToInsert.length > 0) {
        await db.insert(categoryOptionValues).values(optionsToInsert).execute();
      }
    } else if (options !== undefined) {
      // If explicitly empty array
      await db.delete(hostelOptions).where(eq(hostelOptions.categoryId, categoryId));
      await db.delete(categoryOptionValues).where(eq(categoryOptionValues.categoryId, categoryId));
    }

    return NextResponse.json({ message: "Category updated successfully." });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { message: "Failed to update category.", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { categoryId } = await req.json();

    if (!categoryId) {
      return NextResponse.json({ message: "Category ID is required for deletion." }, { status: 400 });
    }

    await db.delete(categoryOptionValues).where(eq(categoryOptionValues.categoryId, categoryId));

    const [deletedCategory] = await db
      .delete(categories)
      .where(eq(categories.categoryId, categoryId))
      .returning();

    if (!deletedCategory) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted successfully." });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Failed to delete category.", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

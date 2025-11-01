import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { hostels, hostelImages, ratings, comments, hostelOptions, categories, categoryOptionValues } from '../../../lib/schema';
import { eq, and, sql, avg, count } from 'drizzle-orm';

export async function GET() {
  try {
    const allHostels = await db.select().from(hostels).where(eq(hostels.isActive, true));

    const finalHostels = await Promise.all(allHostels.map(async (hostel) => {
      const hostelCategoryOptions: { categoryName: string; optionName: string }[] = [];

      const hostelOpts = await db.select({
        categoryId: hostelOptions.categoryId,
        optionId: hostelOptions.optionId
      })
      .from(hostelOptions)
      .where(eq(hostelOptions.hostelId, hostel.hostelId));

      for (const opt of hostelOpts) {
        const category = await db.select({ categoryName: categories.category }).from(categories).where(eq(categories.categoryId, opt.categoryId!));
        if (category.length > 0) {
          const optionValue = await db.select({ optionName: categoryOptionValues.optionName }).from(categoryOptionValues).where(eq(categoryOptionValues.optionId, opt.optionId!));
          if (optionValue.length > 0) {
            hostelCategoryOptions.push({
              categoryName: category[0].categoryName!,
              optionName: optionValue[0].optionName!,
            });
          }
        }
      }

      const hostelImagesData = await db.select().from(hostelImages).where(eq(hostelImages.hostelId, hostel.hostelId));

      const ratingData = await db.select({
        averageRating: avg(ratings.overallRating),
        totalRatings: count(ratings.ratingId)
      }).from(ratings).where(eq(ratings.hostelId, hostel.hostelId));

      const recentComments = await db.select().from(comments)
        .where(eq(comments.hostelId, hostel.hostelId))
        .orderBy(sql`${comments.createdAt} DESC`)
        .limit(5);

      return {
        ...hostel,
        categories: hostelCategoryOptions,
        images: hostelImagesData,
        averageRating: ratingData[0]?.averageRating ? Number(ratingData[0].averageRating) : null,
        totalRatings: Number(ratingData[0]?.totalRatings || 0),
        comments: recentComments,
      };
    }));

    return NextResponse.json(finalHostels);
  } catch (error) {
    console.error('Error fetching hostels:', error);
    return NextResponse.json({ message: 'Failed to fetch hostels.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { hostelName, hostelDescription, location, address, phoneNumber, email, website, priceRange, hostelCategoryOptions } = await req.json();

    const [newHostel] = await db.insert(hostels).values({
      hostelName,
      hostelDescription,
      location,
      address,
      phoneNumber,
      email,
      website,
      priceRange,
      createdAt: new Date(),
    }).returning({ hostelId: hostels.hostelId });

    if (!newHostel?.hostelId) {
      return NextResponse.json({ message: 'Failed to create hostel.' }, { status: 500 });
    }

    if (hostelCategoryOptions?.length) {
      for (const mapping of hostelCategoryOptions) {
        if (!mapping.optionName) continue;

        const category = await db.select({ categoryId: categories.categoryId }).from(categories).where(eq(categories.category, mapping.categoryName));
        if (!category.length) continue;

        const option = await db.select({ optionId: categoryOptionValues.optionId }).from(categoryOptionValues)
          .where(and(
            eq(categoryOptionValues.optionName, mapping.optionName),
            eq(categoryOptionValues.categoryId, category[0].categoryId)
          ));
        if (!option.length) continue;

        await db.insert(hostelOptions).values({
          hostelId: newHostel.hostelId,
          categoryId: category[0].categoryId,
          optionId: option[0].optionId,
        });
      }
    }

    return NextResponse.json(newHostel, { status: 201 });
  } catch (error) {
    console.error('Error adding hostel:', error);
    return NextResponse.json({ message: 'Failed to add hostel.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { hostelId, hostelName, hostelDescription, location, address, phoneNumber, email, website, priceRange, hostelCategoryOptions } = await req.json();
    if (!hostelId) return NextResponse.json({ message: 'Hostel ID is required.' }, { status: 400 });

    await db.update(hostels).set({
      hostelName, hostelDescription, location, address, phoneNumber, email, website, priceRange
    }).where(eq(hostels.hostelId, hostelId));

    await db.delete(hostelOptions).where(eq(hostelOptions.hostelId, hostelId));

    if (hostelCategoryOptions?.length) {
      for (const mapping of hostelCategoryOptions) {
        if (!mapping.optionName) continue;

        const category = await db.select({ categoryId: categories.categoryId }).from(categories).where(eq(categories.category, mapping.categoryName));
        if (!category.length) continue;

        const option = await db.select({ optionId: categoryOptionValues.optionId }).from(categoryOptionValues)
          .where(and(
            eq(categoryOptionValues.optionName, mapping.optionName),
            eq(categoryOptionValues.categoryId, category[0].categoryId)
          ));
        if (!option.length) continue;

        await db.insert(hostelOptions).values({
          hostelId, categoryId: category[0].categoryId, optionId: option[0].optionId
        });
      }
    }

    return NextResponse.json({ message: 'Hostel updated successfully.' });
  } catch (error) {
    console.error('Error updating hostel:', error);
    return NextResponse.json({ message: 'Failed to update hostel.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get('hostelId');
    if (!hostelId) return NextResponse.json({ message: 'Hostel ID is required.' }, { status: 400 });

    await db.update(hostels).set({ isActive: false }).where(eq(hostels.hostelId, parseInt(hostelId)));

    return NextResponse.json({ message: 'Hostel deleted successfully.' });
  } catch (error) {
    console.error('Error deleting hostel:', error);
    return NextResponse.json({ message: 'Failed to delete hostel.' }, { status: 500 });
  }
}

import { db } from "@/lib/db";
import {
  users,
  hostels,
  categories,
  categoryOptionValues,
  hostelOptions,
  hostelImages,
  ratings,
  comments,
} from "@/lib/schema";

async function seed() {
  try {
    // ---------------- Insert Dummy Users ----------------
    const insertedUsers = await db.insert(users).values([
      { userRole: "student", displayName: "Alice" },
      { userRole: "student", displayName: "Bob" },
      { userRole: "student", displayName: "Charlie" },
    ]).returning({ id: users.uid, displayName: users.displayName });

    console.log("✅ Dummy users inserted");

    const getUserId = (displayName: string) => {
      const user = insertedUsers.find(u => u.displayName === displayName);
      if (!user) throw new Error(`User not found: ${displayName}`);
      return user.id;
    };

    // ---------------- Insert Categories ----------------
    const insertedCategories = await db.insert(categories).values([
      { category: "Amenities" },
      { category: "Distance" },
      { category: "Hostel Type" },
      { category: "Gender" },
    ]).returning({ id: categories.categoryId, name: categories.category });

    console.log("✅ Categories inserted");

    const catId = (name: string) => {
      const category = insertedCategories.find(c => c.name === name);
      if (!category) throw new Error(`Category not found: ${name}`);
      return category.id;
    };

    // ---------------- Insert Category Option Values ----------------
    const insertedOptions = await db.insert(categoryOptionValues).values([
      { optionName: "Food", categoryId: catId("Amenities") },
      { optionName: "WiFi", categoryId: catId("Amenities") },
      { optionName: "AC", categoryId: catId("Amenities") },
      { optionName: "Water Heater", categoryId: catId("Amenities") },

      { optionName: "Near 500m", categoryId: catId("Distance") },
      { optionName: "1km", categoryId: catId("Distance") },
      { optionName: "More than 1km", categoryId: catId("Distance") },

      { optionName: "PG", categoryId: catId("Hostel Type") },
      { optionName: "Rented", categoryId: catId("Hostel Type") },
      

      { optionName: "Boys", categoryId: catId("Gender") },
      { optionName: "Girls", categoryId: catId("Gender") },
    ]).returning({ id: categoryOptionValues.optionId, name: categoryOptionValues.optionName });

    console.log("✅ Category options inserted");

    const getOptionId = (name: string) => {
      const option = insertedOptions.find(o => o.name === name);
      if (!option) throw new Error(`Option not found: ${name}`);
      return option.id;
    };

    // ---------------- Insert Hostels ----------------
    const insertedHostels = await db.insert(hostels).values([
      {
        hostelName: "Kerala PG Hostel",
        hostelDescription: "Comfortable PG for boys with all basic amenities.",
        location: "https://maps.google.com/?q=Kerala+PG+Hostel",
        address: "Near College, Kerala",
        phoneNumber: "+918000111222",
        email: "pgkerala@example.com",
        website: "https://pgkerala.example.com",
        createdByUid: getUserId("Alice"),
      },
      {
        hostelName: "Girls Hostel Kerala",
        hostelDescription: "Safe and well-maintained hostel for girls.",
        location: "https://maps.google.com/?q=Girls+Hostel+Kerala",
        address: "College Road, Kerala",
        phoneNumber: "+918000333444",
        email: "girlskerala@example.com",
        website: "https://girlskerala.example.com",
        createdByUid: getUserId("Bob"),
      },
    ]).returning({ id: hostels.hostelId, name: hostels.hostelName });

    console.log("✅ Hostels inserted");

    // ---------------- Insert Hostel Options ----------------
    const hostelOptionData = [
      { hostelId: insertedHostels[0].id, categoryId: catId("Amenities"), optionId: getOptionId("Food") },
      { hostelId: insertedHostels[0].id, categoryId: catId("Amenities"), optionId: getOptionId("WiFi") },
      { hostelId: insertedHostels[0].id, categoryId: catId("Amenities"), optionId: getOptionId("AC") },
      { hostelId: insertedHostels[0].id, categoryId: catId("Distance"), optionId: getOptionId("Near 500m") },
      { hostelId: insertedHostels[0].id, categoryId: catId("Hostel Type"), optionId: getOptionId("PG") },
      { hostelId: insertedHostels[0].id, categoryId: catId("Gender"), optionId: getOptionId("Boys") },

      { hostelId: insertedHostels[1].id, categoryId: catId("Amenities"), optionId: getOptionId("WiFi") },
      { hostelId: insertedHostels[1].id, categoryId: catId("Amenities"), optionId: getOptionId("Water Heater") },
      { hostelId: insertedHostels[1].id, categoryId: catId("Distance"), optionId: getOptionId("1km") },
      { hostelId: insertedHostels[1].id, categoryId: catId("Hostel Type"), optionId: getOptionId("Rented") },
      { hostelId: insertedHostels[1].id, categoryId: catId("Gender"), optionId: getOptionId("Girls") },
    ];

    await db.insert(hostelOptions).values(hostelOptionData);
    console.log("✅ Hostel options linked");

    // ---------------- Insert Hostel Images ----------------
    await db.insert(hostelImages).values([
      { hostelId: insertedHostels[0].id, imageUrl: "https://example.com/pg1.jpg", isPrimary: true },
      { hostelId: insertedHostels[1].id, imageUrl: "https://example.com/girls1.jpg", isPrimary: true },
    ]);
    console.log("✅ Hostel images inserted");

    // ---------------- Insert Ratings ----------------
    await db.insert(ratings).values([
      { hostelId: insertedHostels[0].id, userId: getUserId("Alice"), overallRating: "4.5" },
      { hostelId: insertedHostels[1].id, userId: getUserId("Bob"), overallRating: "4.8" },
    ]);
    console.log("✅ Ratings inserted");

    // ---------------- Insert Comments ----------------
    await db.insert(comments).values([
      { hostelId: insertedHostels[0].id, userId: getUserId("Alice"), commentText: "Nice PG with great facilities.", userName: "Alice", userEmail: "alice@example.com", isVerified: true },
      { hostelId: insertedHostels[1].id, userId: getUserId("Bob"), commentText: "Safe and comfortable hostel.", userName: "Bob", userEmail: "bob@example.com", isVerified: true },
    ]);
    console.log("✅ Comments inserted");

    console.log("🎉 Hostel seeding completed successfully!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
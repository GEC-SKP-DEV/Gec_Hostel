import { z } from 'zod';

export const HostelCategoryOptionSchema = z.object({
  categoryName: z.string().min(1),
  optionName: z.string().min(1),
});

export const CreateHostelSchema = z.object({
  hostelName: z.string().min(1),
  hostelDescription: z.string().optional(),
  location: z.string().min(1),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  priceRange: z.string().optional(),
  hostelCategoryOptions: z.array(HostelCategoryOptionSchema).optional(),
});

export const UpdateHostelSchema = CreateHostelSchema.extend({
  hostelId: z.number().int().positive(),
});

export const CreateCategorySchema = z.object({
  categoryName: z.string().min(1),
  options: z.array(z.union([z.string().min(1), z.object({ optionName: z.string().min(1) })])).optional(),
});

export const UpdateCategorySchema = z.object({
  categoryId: z.number().int().positive(),
  categoryName: z.string().min(1),
  options: z
    .array(
      z.object({
        optionName: z.string().min(1),
      })
    )
    .optional(),
});

export const UpdateCategoryOptionSchema = z.object({
  categoryName: z.string().min(1),
  optionId: z.number().int().positive(),
  optionName: z.string().min(1),
});

export const DeleteCategoryOptionSchema = z.object({
  categoryName: z.string().min(1),
  optionId: z.number().int().positive(),
});

export const AddImageSchema = z.object({
  hostelId: z.coerce.number().int().positive(),
  imageType: z.string().optional(),
  isPrimary: z.coerce.boolean().optional(),
});

export const UpdateImageSchema = z.object({
  imageId: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  imageType: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const CreateRatingSchema = z.object({
  hostelId: z.number().int().positive(),
  userId: z.number().int().positive(),
  overallRating: z.coerce.number().min(1).max(5),
});

export const UpdateRatingSchema = z.object({
  ratingId: z.number().int().positive(),
  overallRating: z.coerce.number().min(1).max(5),
});

export const CreateCommentSchema = z.object({
  hostelId: z.number().int().positive(),
  userId: z.number().int().positive(),
  commentText: z.string().min(1),
  userName: z.string().optional(),
  userEmail: z.string().email().optional(),
});

export const UpdateCommentSchema = z.object({
  commentId: z.number().int().positive(),
  commentText: z.string().optional(),
  isVerified: z.boolean().optional(),
});

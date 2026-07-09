import { z } from 'zod';

export const objectOptionEntrySchema = z.object({
  object_id: z.string().min(1),
  category: z.string().min(1),
  value: z.string().min(1),
  position: z.number(),
  image: z.string().nullable(),
  price: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

export const objectOptionsResponseSchema = z.object({
  object_id: z.string().min(1),
  options: z.record(z.string(), z.array(objectOptionEntrySchema)),
});

export type ObjectOptionEntryDto = z.infer<typeof objectOptionEntrySchema>;
export type ObjectOptionsResponseDto = z.infer<typeof objectOptionsResponseSchema>;

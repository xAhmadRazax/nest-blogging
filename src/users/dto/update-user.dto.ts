import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  hashedPassword: z.string().optional(),
  isVerified: z.boolean().optional(),
  avatar: z.url().optional(),
  passwordChangedAt: z.date().optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

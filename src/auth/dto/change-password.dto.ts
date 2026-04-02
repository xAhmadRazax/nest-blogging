import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ChangePasswordSchema = z.object({
  password: z
    .string()
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase character')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase character')
    .regex(/[0-9]/, 'Password must contain at least 1 digit')
    .regex(/^[A-Za-z0-9]/, 'Password must contain at least 1 special character')
    .min(8, 'Password needs to be at least of 6 characters longs')
    .max(20, "Password can't be longer than 20 characters"),
  newPassword: z
    .string()
    .regex(/[A-Z]/, 'New password must contain at least 1 uppercase character')
    .regex(/[a-z]/, 'New password must contain at least 1 lowercase character')
    .regex(/[0-9]/, 'New password must contain at least 1 digit')
    .regex(
      /^[A-Za-z0-9]/,
      'New password must contain at least 1 special character',
    )
    .min(8, 'New password needs to be at least of 6 characters longs')
    .max(20, "New password can't be longer than 20 characters"),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}

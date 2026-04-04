import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ForgotPasswordSchema = z.object({
  email: z.email({ error: 'email is required' }),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

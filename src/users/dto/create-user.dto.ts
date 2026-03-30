import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  username: z.string({ error: 'username is required' }),
  email: z.email({ error: 'email is required' }),
  hashedPassword: z.string({ error: 'password is required' }),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

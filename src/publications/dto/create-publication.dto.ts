import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreatePublicationSchema = z.object({
  name: z.string({ error: 'name is required' }).min(3).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  logo: z.url().optional(),
});

export class CreatePublicationDto extends createZodDto(
  CreatePublicationSchema,
) {}

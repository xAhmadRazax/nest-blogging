import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdatePublicationSchema = z.object({
  name: z.string().min(3).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  logo: z.url().optional(),
});

export class UpdatePublicationDto extends createZodDto(
  UpdatePublicationSchema,
) {}

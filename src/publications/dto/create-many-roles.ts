import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
const CreateManyRoleSchema = z.array(
  z.object({
    name: z.string({ error: 'name is required' }).min(3).max(100).trim(),
    publicationId: z.uuid({ error: 'publicationId is required' }),
  }),
);
export class CreateManyRoleDto extends createZodDto(CreateManyRoleSchema) {}

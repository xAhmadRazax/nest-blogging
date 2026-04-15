import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateRoleSchema = z.object({
  name: z.string({ error: 'name is required' }).min(3).max(100).trim(),
  publicationId: z.uuid({ error: 'publicationId is required' }),
});
const CreateBatchRoleSchema = z.array(
  z.object([
    {
      name: z.string({ error: 'name is required' }).min(3).max(100).trim(),
      publicationId: z.uuid({ error: 'publicationId is required' }),
    },
  ]),
);

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
export class CreateBatchRoleDto extends createZodDto(CreateBatchRoleSchema) {}

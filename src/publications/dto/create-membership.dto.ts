import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMembershipSchema = z.object({
  isOwner: z.boolean().optional(),
  roleId: z.uuid({ error: 'roleId is required' }),
  userId: z.uuid({ error: 'userId is required' }),
  publicationId: z.uuid({ error: 'publicationId is required' }),
});

export class CreateMembershipDto extends createZodDto(CreateMembershipSchema) {}

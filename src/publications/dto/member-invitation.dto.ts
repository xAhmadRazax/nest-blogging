import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const MemberInvitationSchema = z.object({
  userId: z.string({ error: 'userId is required' }),
  roleId: z.string({ error: 'roleId is required' }),
});

export class MemberInvitationDto extends createZodDto(MemberInvitationSchema) {}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TokenService } from 'src/common/services/token.service';
import { Transaction, type DB } from 'src/db/client';
import { InjectDb } from 'src/db/db.provider';
import { UsersService } from 'src/users/users.service';
import { memberInvitations } from './schemas/member-invitations.schema';
import { TypeConfigService } from 'src/config/type.config.service';
import ms from 'ms';
import { EmailService } from 'src/common/services/email.service';
import { PublicationsService } from './publications.service';
import { RolesService } from './roles.service';
import { and, eq, lt, SQL } from 'drizzle-orm';

@Injectable()
export class MemberInvitationsService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
    private readonly PublicationService: PublicationsService,
    private readonly roleService: RolesService,
    private readonly emailService: EmailService,
    private readonly configService: TypeConfigService,
  ) {}

  async create({
    userId,
    roleId,
    invitedById,
    publicationId,
  }: {
    roleId: string;
    userId: string;
    invitedById: string;
    publicationId: string;
  }) {
    await this.db.transaction(async (tx) => {
      const user = await this.usersService.findOne(userId, tx);
      if (!user) {
        throw new NotFoundException(`User with ${userId} doesn't exists`);
      }

      const publication = await this.PublicationService.findOneById(
        publicationId,
        tx,
      );

      if (!publication) {
        throw new NotFoundException(
          `Publication with ${publicationId} doesn't exists`,
        );
      }

      const membersMap = new Map(
        publication.members.map((member) => [member.id, member]),
      );

      if (membersMap.has(userId)) {
        throw new ConflictException('User is already a Member of Publication');
      }

      const role = await this.roleService.findOne(roleId);

      if (role?.publicationId !== publicationId) {
        throw new NotFoundException(
          `Role  with ${roleId} doesn't exists in the publication`,
        );
      }

      const token = this.tokenService.generateCryptoToken();
      const hashedToken = this.tokenService.encryptCryptoToken(token);
      const expiresAt = new Date(
        +ms(
          this.configService.get('common', {
            infer: true,
          })!.memberInvitationExpiry,
        ),
      );

      await tx.insert(memberInvitations).values({
        publicationId,
        roleId,
        userId,
        invitedBy: invitedById,
        token: hashedToken,
        expiresAt,
      });

      await this.emailService.sendMemberInvitationEmail({
        recipientName: user.username,
        recipientAddress: user.email,
        publicationName: publication.name,
        roleName: role.name,
        url: '',
      });

      return {
        token,
        username: user.username,
        email: user.email,
      };
    });
  }
  async findOne(publicationId: string, token: string) {
    await this.db.transaction(async (tx) => {
      const publication = await this.PublicationService.findOneById(
        publicationId,
        tx,
      );

      if (!publication) {
        throw new NotFoundException(
          `Publication with ${publicationId} doesn't exists`,
        );
      }
      const hashedToken = this.tokenService.encryptCryptoToken(token);
      const validInvitation = await tx.query.memberInvitations.findFirst({
        where: and(
          eq(memberInvitations.token, hashedToken),
          lt(memberInvitations.expiresAt, new Date()),
        ),
      });

      if (!validInvitation) {
        throw new NotFoundException('Token is either invalid or Expired');
      }
    });
  }

  async findMany(filters: SQL, tx?: Transaction) {
    const queryBuilder = tx ?? this.db;
    return await queryBuilder.query.memberInvitations.findMany({
      where: filters,
      with: { role: true, user: true },
    });
  }
  private update() {}
}

import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { InjectDb } from 'src/db/db.provider';
import type { DB, Transaction } from 'src/db/client';
import { PublicUser, User, users } from './schemas/users.schema';
import { eq, SQL } from 'drizzle-orm';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectDb() private readonly db: DB,
    private readonly logger: Logger,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const [user] = await this.db
      .insert(users)
      .values(createUserDto)
      .returning();

    return this.sanitize(user);
  }
  async findOne(id: string, tx?: Transaction) {
    const queryBuilder = tx ? tx : this.db;
    const [user] = await queryBuilder
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  // findOne(id: number) {
  //   const user = this.db.select().from(users).w;
  //   return '';
  // }

  async findOneByFilters(filters: SQL) {
    // const [user] = await this.db
    //   .select()
    //   .from(users)
    //   .where(eq(users.email, email))
    //   .limit(1);

    const user = await this.db.query.users.findFirst({
      where: filters,
      with: {
        members: {
          with: {
            role: { with: { rolePermissions: { with: { permission: true } } } },
            publication: true,
          },
        },
      },
    });
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, tx?: Transaction) {
    const queryBuilding = tx ? tx : this.db;
    const [updatedUser] = await queryBuilding
      .update(users)
      .set(updateUserDto)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  sanitize(user: User): PublicUser {
    const {
      hashedPassword: _hashedPassword,
      passwordChangedAt: _passwordChangedAt,
      ...publicUser
    } = user;
    return publicUser;
  }
  userWithPublicationAndRoles(
    user: Awaited<ReturnType<typeof this.findOneByFilters>>,
  ) {
    if (!user) return;

    const publicationsWithRolesAndPermissions = user.members.map((member) => ({
      id: member.publication.id,
      name: member.publication.name,
      role: member.role.name,
      roleId: member.role.id,
      permissions: member.role.rolePermissions.map(
        (rp) => `${rp.permission.action}:${rp.permission.resource}`,
      ),
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.isVerified,
        passwordChangedAt: user.passwordChangedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      publications: publicationsWithRolesAndPermissions,
    };
  }
}

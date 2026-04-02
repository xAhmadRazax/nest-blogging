import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { InjectDb } from 'src/db/db.provider';
import type { DB } from 'src/db/client';
import { PublicUser, User, users } from './schemas/users.schema';
import { eq } from 'drizzle-orm';
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
  async findOne(id: string) {
    const [user] = await this.db
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

  async findOneByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const [updatedUser] = await this.db
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
    const { hashedPassword, passwordChangedAt, ...publicUser } = user;
    void hashedPassword;
    void passwordChangedAt;
    return publicUser;
  }
}

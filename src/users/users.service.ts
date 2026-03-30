import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { InjectDb } from 'src/db/db.provider';
import type { DB } from 'src/db/client';
import { PublicUser, User, users } from './schemas/users.schema';
import { eq } from 'drizzle-orm';

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

    this.logger.log(`User with the email: ${user.email} has been created`);

    return this.sanitize(user);
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

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  sanitize(user: User): PublicUser {
    const { hashedPassword, ...publicUser } = user;
    void hashedPassword;
    return publicUser;
  }
}

import { IsEmail, IsString, MinLength } from 'class-validator';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid') // better than string for PK
  id: string;

  @IsEmail({}, { message: 'Invalid email' })
  @Column({ unique: true })
  @Index()
  email: string;

  @IsString()
  @Column()
  name: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  passwordChangedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpiry?: Date | null;

  @BeforeInsert()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
  }
}

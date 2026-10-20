import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: userSelect,
    });
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      return await this.prisma.user.create({
        data: { email, passwordHash, role: 'ADMIN' },
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com esse e-mail.');
      }
      throw error;
    }
  }

  async update(userId: string, dto: UpdateUserDto) {
    const email = dto.email.trim().toLowerCase();
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { email },
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um usuário com esse e-mail.');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      throw error;
    }
  }

  async resetPassword(userId: string, dto: ResetUserPasswordDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
        select: userSelect,
      });
      return { user, message: 'Senha redefinida.' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      throw error;
    }
  }
}

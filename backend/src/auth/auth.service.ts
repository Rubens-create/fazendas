import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInitialAdminDto } from './dto/create-initial-admin.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async setupStatus() {
    return { needsSetup: (await this.prisma.user.count()) === 0 };
  }

  async setup(dto: CreateInitialAdminDto) {
    if ((await this.prisma.user.count()) > 0)
      throw new ConflictException('A conta inicial já foi criada.');

    const email = dto.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, 12);
    let user: { id: string; email: string; role: string };
    try {
      user = await this.prisma.$transaction(
        async (tx) => {
          if ((await tx.user.count()) > 0)
            throw new ConflictException('A conta inicial já foi criada.');
          return tx.user.create({
            data: { email, passwordHash, role: 'ADMIN' },
            select: { id: true, email: true, role: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      ) {
        throw new ConflictException('A conta inicial já foi criada.');
      }
      throw error;
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '1d'),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '1d') };
  }

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
  }
}

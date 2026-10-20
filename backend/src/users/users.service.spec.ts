jest.mock('bcrypt', () => ({ hash: jest.fn() }));

import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const user = {
    id: 'e0b41c44-e289-493e-8d75-5f78621f5b45',
    email: 'staff@example.com',
    role: 'ADMIN',
    createdAt: new Date('2026-10-15T00:00:00.000Z'),
  };
  let prisma: { user: { findMany: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('bcrypt-hash');
    prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([user]),
        create: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(user),
      },
    };
    service = new UsersService(prisma as never);
  });

  it('lists users without exposing password hashes', async () => {
    await expect(service.findAll()).resolves.toEqual([user]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, email: true, role: true, createdAt: true },
    });
  });

  it('creates regular users as ADMIN and stores only a bcrypt hash', async () => {
    await service.create({ email: ' STAFF@Example.com ', password: 'strong-pass-123' });
    expect(bcrypt.hash).toHaveBeenCalledWith('strong-pass-123', 12);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'staff@example.com', passwordHash: 'bcrypt-hash', role: 'ADMIN' },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  });

  it('updates the email and normalizes its casing', async () => {
    await service.update(user.id, { email: ' STAFF@Example.com ' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { email: 'staff@example.com' },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  });

  it('resets a password without returning its hash', async () => {
    await expect(service.resetPassword(user.id, { password: 'new-pass-123' })).resolves.toEqual({
      user,
      message: 'Senha redefinida.',
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('new-pass-123', 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { passwordHash: 'bcrypt-hash' },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  });

  it('reports duplicate e-mails as a conflict', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.16.2',
      }),
    );
    await expect(service.create({ email: user.email, password: 'strong-pass-123' })).rejects.toBeInstanceOf(ConflictException);
  });
});

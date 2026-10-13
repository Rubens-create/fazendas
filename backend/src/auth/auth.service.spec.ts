jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService first-user setup', () => {
  const user = { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN', passwordHash: 'hash' };
  let prisma: any;
  let txUser: any;
  let jwt: any;
  let service: AuthService;

  beforeEach(() => {
    txUser = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(user),
    };
    prisma = {
      user: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ user: txUser })),
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    service = new AuthService(prisma as never, jwt as never, { get: () => '1d' } as never);
  });

  it('reports that setup is needed only when the users table is empty', async () => {
    await expect((service as any).setupStatus()).resolves.toEqual({ needsSetup: true });
    prisma.user.count.mockResolvedValueOnce(1);
    await expect((service as any).setupStatus()).resolves.toEqual({ needsSetup: false });
  });

  it('creates a single admin with a bcrypt hash and returns a login token', async () => {
    const result = await (service as any).setup({ email: ' ADMIN@Example.com ', password: 'strong-pass-123' });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(txUser.create).toHaveBeenCalledWith({
      data: { email: 'admin@example.com', passwordHash: expect.any(String), role: 'ADMIN' },
      select: { id: true, email: true, role: true },
    });
    const savedHash = txUser.create.mock.calls[0][0].data.passwordHash;
    await expect(bcrypt.compare('strong-pass-123', savedHash)).resolves.toBe(true);
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: user.id, email: user.email, role: user.role });
    expect(result).toEqual({ accessToken: 'signed-token', expiresIn: '1d' });
  });

  it('refuses setup after an account already exists', async () => {
    prisma.user.count.mockResolvedValueOnce(1);
    await expect((service as any).setup({ email: 'admin@example.com', password: 'strong-pass-123' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(txUser.create).not.toHaveBeenCalled();
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});

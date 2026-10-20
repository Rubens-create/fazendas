import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SuperAdminGuard } from './super-admin.guard';

describe('SuperAdminGuard', () => {
  const request = { user: { sub: 'user-id', role: 'ADMIN' } };
  let prisma: { user: { findUnique: jest.Mock } };
  let guard: SuperAdminGuard;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    guard = new SuperAdminGuard(prisma as never);
  });

  it('checks the current database role instead of trusting the JWT role', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      select: { role: true },
    });
  });

  it('rejects regular administrators', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

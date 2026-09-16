import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('retorna status saudável quando o banco responde', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const controller = new HealthController(prisma as never);
    await expect(controller.check()).resolves.toEqual({ status: 'ok', database: 'ok' });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});

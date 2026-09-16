import { FarmsService } from './farms.service';

describe('FarmsService', () => {
  it('lista fazendas ordenadas e inclui checklist/documentos', async () => {
    const farms = [{ id: 'farm-1', name: 'Fazenda A', checklist: [], documents: [] }];
    const prisma = { farm: { findMany: jest.fn().mockResolvedValue(farms) } };
    const service = new FarmsService(prisma as never);
    await expect(service.findAll()).resolves.toEqual(farms);
    expect(prisma.farm.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' }, include: { checklist: true, documents: true } });
  });
});

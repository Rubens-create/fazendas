import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FarmsService } from './farms.service';

describe('FarmsService', () => {
  it('lista fazendas ordenadas e inclui checklist/documentos', async () => {
    const farms = [{ id: 'farm-1', name: 'Fazenda A', checklist: [], documents: [] }];
    const prisma = { farm: { findMany: jest.fn().mockResolvedValue(farms) } };
    const service = new FarmsService(prisma as never);
    await expect(service.findAll()).resolves.toEqual(farms);
    expect(prisma.farm.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' }, include: { checklist: true, documents: true } });
  });

  describe('cover storage', () => {
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);
    let root: string;
    let originalStorageRoot: string | undefined;
    let farm: { id: string; coverImage: string | null };
    let prisma: { farm: { findUnique: jest.Mock; update: jest.Mock } };
    let service: FarmsService;

    beforeEach(async () => {
      root = await mkdtemp(join(tmpdir(), 'farm-covers-'));
      originalStorageRoot = process.env.STORAGE_ROOT;
      process.env.STORAGE_ROOT = root;
      farm = { id: 'farm-123', coverImage: null };
      prisma = {
        farm: {
          findUnique: jest.fn().mockImplementation(async () => ({ ...farm })),
          update: jest.fn().mockImplementation(async ({ data }) => {
            farm = { ...farm, ...data };
            return { ...farm, checklist: [], documents: [] };
          }),
        },
      };
      service = new FarmsService(prisma as never);
    });

    afterEach(async () => {
      if (originalStorageRoot === undefined) delete process.env.STORAGE_ROOT;
      else process.env.STORAGE_ROOT = originalStorageRoot;
      await rm(root, { recursive: true, force: true });
    });

    it('stores verified cover bytes and persists only a relative storage path', async () => {
      const result = await service.uploadCover('farm-123', {
        buffer: pngBytes,
        mimetype: 'image/png',
      } as Express.Multer.File);

      expect(result.coverImage).toMatch(/^farm-covers\/farm-123-[\w-]+\.png$/);
      expect(farm.coverImage).toBe(result.coverImage);
      await expect(readFile(join(root, result.coverImage!))).resolves.toEqual(pngBytes);
      const cover = await service.coverFile('farm-123');
      expect(cover.mimeType).toBe('image/png');
      const chunks: Buffer[] = [];
      for await (const chunk of cover.stream) chunks.push(Buffer.from(chunk));
      expect(Buffer.concat(chunks)).toEqual(pngBytes);
    });

    it('removes the previous managed file after a replacement succeeds', async () => {
      const oldPath = 'farm-covers/farm-123-previous.png';
      await mkdir(join(root, 'farm-covers'), { recursive: true });
      await writeFile(join(root, oldPath), pngBytes);
      farm.coverImage = oldPath;

      await service.uploadCover('farm-123', {
        buffer: pngBytes,
        mimetype: 'image/png',
      } as Express.Multer.File);

      await expect(readFile(join(root, oldPath))).rejects.toMatchObject({ code: 'ENOENT' });
    });

    it('rejects non-image bytes without changing the farm record', async () => {
      await expect(service.uploadCover('farm-123', {
        buffer: Buffer.from('not an image'),
        mimetype: 'image/png',
      } as Express.Multer.File)).rejects.toThrow('A imagem precisa ser PNG, JPEG ou WebP.');

      expect(prisma.farm.update).not.toHaveBeenCalled();
      expect(farm.coverImage).toBeNull();
    });
  });
});

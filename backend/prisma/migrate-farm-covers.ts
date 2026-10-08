import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { decodeLegacyCoverDataUrl } from '../src/farms/cover-storage';

const prisma = new PrismaClient();
const storageRoot = process.env.STORAGE_ROOT ?? './storage';

async function migrateLegacyCovers() {
  const farms = await prisma.farm.findMany({
    where: { coverImage: { startsWith: 'data:image/' } },
    select: { id: true, coverImage: true },
  });
  let migrated = 0;
  let skipped = 0;

  for (const farm of farms) {
    if (!farm.coverImage) continue;
    const cover = decodeLegacyCoverDataUrl(farm.coverImage);
    if (!cover) {
      skipped += 1;
      continue;
    }

    const storagePath = `farm-covers/${farm.id}-${randomUUID()}.${cover.extension}`;
    const absolutePath = join(storageRoot, storagePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, cover.bytes, { flag: 'wx' });

    try {
      const update = await prisma.farm.updateMany({
        where: { id: farm.id, coverImage: farm.coverImage },
        data: { coverImage: storagePath },
      });
      if (update.count === 1) migrated += 1;
      else {
        skipped += 1;
        await rm(absolutePath, { force: true });
      }
    } catch (error) {
      await rm(absolutePath, { force: true });
      throw error;
    }
  }

  console.log(`Capas migradas: ${migrated}; não alteradas ou inválidas: ${skipped}.`);
}

migrateLegacyCovers()
  .catch((error) => {
    console.error('Falha ao migrar capas antigas. Nenhum arquivo original foi removido.');
    console.error(error instanceof Error ? error.message : 'Erro desconhecido.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

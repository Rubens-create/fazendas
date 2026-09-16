import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MoveDocumentDto } from './dto/move-document.dto';
import { createReadStream, promises as fs } from 'node:fs';
import { basename, join } from 'node:path';

@Injectable()
export class DocumentsService {
  private readonly root: string;
  constructor(private readonly prisma: PrismaService, config: ConfigService) { this.root = config.get<string>('STORAGE_ROOT', './storage'); }
  findAll() { return this.prisma.document.findMany({ include: { farm: true, folder: true }, orderBy: { uploadedAt: 'desc' } }); }
  async findOne(id: string) { const doc = await this.prisma.document.findUnique({ where: { id } }); if (!doc) throw new NotFoundException('Documento não encontrado.'); return doc; }
  async saveUpload(file: Express.Multer.File, farmId?: string, folderId?: string, checklistDocumentKey?: string) {
    await fs.mkdir(this.root, { recursive: true });
    const safeName = basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = join(this.root, `${Date.now()}_${safeName}`);
    await fs.writeFile(storagePath, file.buffer);
    return this.prisma.document.create({ data: { originalName: file.originalname, fileType: file.mimetype, fileSize: file.size, storagePath, farmId, folderId, checklistDocumentKey } });
  }
  async move(id: string, dto: MoveDocumentDto) { await this.findOne(id); return this.prisma.document.update({ where: { id }, data: dto }); }
  async remove(id: string) { const doc = await this.findOne(id); await fs.rm(doc.storagePath, { force: true }); await this.prisma.document.delete({ where: { id } }); return { deleted: true }; }
  async stream(id: string) { const doc = await this.findOne(id); return { doc, stream: createReadStream(doc.storagePath) }; }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, MoveFolderDto } from './dto/folder.dto';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.folder.findMany({ include: { children: true }, orderBy: { name: 'asc' } }); }
  async findOne(id: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id }, include: { children: true, documents: true } });
    if (!folder) throw new NotFoundException('Pasta não encontrada.');
    return folder;
  }
  create(dto: CreateFolderDto) { return this.prisma.folder.create({ data: dto }); }
  async update(id: string, dto: Partial<CreateFolderDto>) { await this.findOne(id); return this.prisma.folder.update({ where: { id }, data: dto }); }
  async move(id: string, dto: MoveFolderDto) { await this.findOne(id); return this.prisma.folder.update({ where: { id }, data: dto }); }
  async remove(id: string) { await this.findOne(id); await this.prisma.folder.delete({ where: { id } }); return { deleted: true }; }
}

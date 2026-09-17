import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { checklistLabel } from './checklist-labels';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const farms = await this.prisma.farm.findMany({
      orderBy: { name: 'asc' },
      include: { checklist: true, documents: true },
    });
    return farms.map((farm) => this.withChecklistLabels(farm));
  }

  async findOne(id: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: { checklist: true, documents: true },
    });
    if (!farm) throw new NotFoundException('Fazenda não encontrada.');
    return this.withChecklistLabels(farm);
  }

  async create(dto: CreateFarmDto) {
    const slug = dto.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!slug)
      throw new BadRequestException(
        'O nome da fazenda não gera um identificador válido.',
      );
    const existing = await this.prisma.farm.findUnique({ where: { slug } });
    if (existing)
      throw new ConflictException('Já existe uma fazenda com esse nome.');
    const checklist = this.checklistData(dto);
    return this.prisma.$transaction(async (tx) => {
      const farm = await tx.farm.create({
        data: {
          slug,
          name: dto.name,
          location: dto.location,
          areaHectares: dto.areaHectares,
          culture: dto.culture,
          status: dto.status,
          coverImage: dto.coverImage,
          checklist: { create: checklist },
        },
      });
      const documentsFolder = await tx.folder.create({
        data: {
          name: 'Documentos',
          icon: 'folder',
          colorClass: 'contratos',
          farmId: farm.id,
        },
      });
      const categories = [
        {
          name: 'DOCUMENTOS DA PROPRIEDADE',
          keys: dto.propertyChecklist ?? [],
        },
        {
          name: 'DOCUMENTOS AMBIENTAIS',
          keys: dto.environmentalChecklist ?? [],
        },
        {
          name: 'DOCUMENTOS PECUARIOS - ADAB',
          keys: dto.livestockChecklist ?? [],
        },
      ];
      for (const category of categories) {
        await tx.folder.create({
          data: {
            name: category.name,
            icon: 'folder',
            colorClass: 'contratos',
            farmId: farm.id,
            parentFolderId: documentsFolder.id,
            children: {
              create: category.keys.map((documentKey) => ({
                name: checklistLabel(documentKey),
                icon: 'file-text',
                colorClass: 'relatorios',
                farmId: farm.id,
              })),
            },
          },
        });
      }
      return tx.farm.findUniqueOrThrow({
        where: { id: farm.id },
        include: { checklist: true, documents: true },
      });
    });
  }

  async updateChecklist(id: string, dto: UpdateChecklistDto) {
    await this.findOne(id);
    const requestedKeys = [
      ...dto.property.map((documentKey) => ({ documentKey })),
      ...dto.environmental.map((documentKey) => ({ documentKey })),
      ...dto.livestock.map((documentKey) => ({ documentKey })),
    ];
    return this.prisma.$transaction(async (tx) => {
      const existingItems = await tx.farmChecklistItem.findMany({
        where: { farmId: id },
        select: { documentKey: true },
      });
      const existingKeys = new Set(
        existingItems.map((item) => item.documentKey),
      );
      const keys = [...new Set(requestedKeys.map((item) => item.documentKey))];
      if (keys.length) {
        await tx.farmChecklistItem.deleteMany({
          where: { farmId: id, documentKey: { notIn: keys } },
        });
      } else {
        await tx.farmChecklistItem.deleteMany({ where: { farmId: id } });
      }
      const newItems = keys.filter(
        (documentKey) => !existingKeys.has(documentKey),
      );
      if (newItems.length)
        await tx.farmChecklistItem.createMany({
          data: newItems.map((documentKey) => ({ documentKey, farmId: id })),
        });
      return tx.farm.findUniqueOrThrow({
        where: { id },
        include: { checklist: true, documents: true },
      });
    });
  }

  async updateChecklistItem(
    farmId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ) {
    const item = await this.prisma.farmChecklistItem.findFirst({
      where: { id: itemId, farmId },
    });
    if (!item) throw new NotFoundException('Item do checklist não encontrado.');
    const data: Prisma.FarmChecklistItemUpdateInput = {};
    if (dto.documentDate !== undefined)
      data.documentDate = dto.documentDate ? new Date(dto.documentDate) : null;
    if (dto.dueDate !== undefined)
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.renewalComments !== undefined)
      data.renewalComments = dto.renewalComments;
    if (dto.renewalDate !== undefined)
      data.renewalDate = dto.renewalDate ? new Date(dto.renewalDate) : null;
    if (dto.documentStatus !== undefined)
      data.documentStatus = dto.documentStatus;
    return this.prisma.farmChecklistItem.update({
      where: { id: itemId },
      data,
    });
  }

  async update(id: string, dto: UpdateFarmDto) {
    await this.findOne(id);
    const data: Prisma.FarmUpdateInput = { ...dto };
    if (dto.relationData !== undefined) data.relationData = dto.relationData;
    if (dto.name) {
      const slug = dto.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const duplicate = await this.prisma.farm.findFirst({
        where: { slug, NOT: { id } },
      });
      if (duplicate)
        throw new ConflictException('Já existe uma fazenda com esse nome.');
      data.slug = slug;
    }
    return this.prisma.farm.update({
      where: { id },
      data,
      include: { checklist: true, documents: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.farm.delete({ where: { id } });
    return { deleted: true };
  }
  async checklist(id: string) {
    const farm = await this.findOne(id);
    return { farmId: farm.id, items: farm.checklist };
  }

  private withChecklistLabels<
    T extends { checklist: Array<{ documentKey: string }> },
  >(farm: T) {
    return {
      ...farm,
      checklist: farm.checklist.map((item) => ({
        ...item,
        label: checklistLabel(item.documentKey),
      })),
    };
  }

  private checklistData(dto: CreateFarmDto) {
    return [
      ...(dto.propertyChecklist ?? []),
      ...(dto.environmentalChecklist ?? []),
      ...(dto.livestockChecklist ?? []),
    ].map((documentKey) => ({ documentKey }));
  }
}

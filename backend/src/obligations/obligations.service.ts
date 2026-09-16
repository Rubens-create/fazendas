import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObligationDto, UpdateObligationDto } from './dto/obligation.dto';

@Injectable()
export class ObligationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.obligation.findMany({ orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }] }); }

  async findOne(id: string) {
    const item = await this.prisma.obligation.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Obrigação não encontrada.');
    return item;
  }

  create(dto: CreateObligationDto) {
    return this.prisma.obligation.create({ data: { title: dto.title, dueDate: new Date(dto.dueDate), priority: dto.priority, category: dto.category, farmId: dto.farmId } });
  }

  async update(id: string, dto: UpdateObligationDto) {
    await this.findOne(id);
    return this.prisma.obligation.update({ where: { id }, data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.obligation.delete({ where: { id } });
    return { deleted: true };
  }
}

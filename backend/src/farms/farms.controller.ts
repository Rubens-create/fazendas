import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { FarmsService } from './farms.service';

@UseGuards(JwtAuthGuard)
@Controller('farms')
export class FarmsController {
  constructor(private readonly farms: FarmsService) {}
  @Get() findAll() { return this.farms.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.farms.findOne(id); }
  @Post() create(@Body() dto: CreateFarmDto) { return this.farms.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateFarmDto) { return this.farms.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.farms.remove(id); }
  @Get(':id/checklist') checklist(@Param('id') id: string) { return this.farms.checklist(id); }
  @Put(':id/checklist') updateChecklist(@Param('id') id: string, @Body() dto: UpdateChecklistDto) { return this.farms.updateChecklist(id, dto); }
  @Patch(':id/checklist/:itemId') updateChecklistItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateChecklistItemDto) { return this.farms.updateChecklistItem(id, itemId, dto); }
}

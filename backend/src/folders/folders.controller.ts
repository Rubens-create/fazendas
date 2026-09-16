import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFolderDto, MoveFolderDto } from './dto/folder.dto';
import { FoldersService } from './folders.service';

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}
  @Get() findAll() { return this.folders.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.folders.findOne(id); }
  @Post() create(@Body() dto: CreateFolderDto) { return this.folders.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: Partial<CreateFolderDto>) { return this.folders.update(id, dto); }
  @Post(':id/move') move(@Param('id') id: string, @Body() dto: MoveFolderDto) { return this.folders.move(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.folders.remove(id); }
}

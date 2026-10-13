import { Body, Controller, Delete, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post, Put, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
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
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadCover(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [
      new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
      new FileTypeValidator({ fileType: /^image\/(?:jpeg|png|webp)$/ }),
    ] })) file: Express.Multer.File,
  ) {
    return this.farms.uploadCover(id, file);
  }
  @Get(':id/cover')
  async cover(@Param('id') id: string, @Res() response: Response) {
    const { stream, mimeType } = await this.farms.coverFile(id);
    response.setHeader('Content-Type', mimeType);
    response.setHeader('Content-Disposition', 'inline');
    response.setHeader('Cache-Control', 'private, max-age=3600');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    stream.pipe(response);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateFarmDto) { return this.farms.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.farms.remove(id); }
  @Get(':id/checklist') checklist(@Param('id') id: string) { return this.farms.checklist(id); }
  @Put(':id/checklist') updateChecklist(@Param('id') id: string, @Body() dto: UpdateChecklistDto) { return this.farms.updateChecklist(id, dto); }
  @Patch(':id/checklist/:itemId') updateChecklistItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateChecklistItemDto) { return this.farms.updateChecklistItem(id, itemId, dto); }
}

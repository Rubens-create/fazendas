import { Body, Controller, Delete, Get, Param, ParseFilePipe, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { MoveDocumentDto } from './dto/move-document.dto';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}
  @Get() findAll() { return this.documents.findAll(); }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile(new ParseFilePipe({ validators: [new FileTypeValidator({ fileType: /(pdf|png|jpe?g|msword|officedocument|excel|csv|plain)/i })] })) file: Express.Multer.File, @Query('farmId') farmId?: string, @Query('folderId') folderId?: string, @Query('checklistDocumentKey') checklistDocumentKey?: string) {
    return this.documents.saveUpload(file, farmId, folderId, checklistDocumentKey);
  }
  @Post(':id/move') move(@Param('id') id: string, @Body() dto: MoveDocumentDto) { return this.documents.move(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.documents.remove(id); }
  @Get(':id/download') async download(@Param('id') id: string, @Res() response: Response) { const { doc, stream } = await this.documents.stream(id); response.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`); response.setHeader('Content-Type', doc.fileType); stream.pipe(response); }
}

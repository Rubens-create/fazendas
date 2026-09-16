import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateObligationDto, UpdateObligationDto } from './dto/obligation.dto';
import { ObligationsService } from './obligations.service';

@UseGuards(JwtAuthGuard)
@Controller('obligations')
export class ObligationsController {
  constructor(private readonly obligations: ObligationsService) {}
  @Get() findAll() { return this.obligations.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.obligations.findOne(id); }
  @Post() create(@Body() dto: CreateObligationDto) { return this.obligations.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateObligationDto) { return this.obligations.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.obligations.remove(id); }
}

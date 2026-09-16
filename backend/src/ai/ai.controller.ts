import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { AiService } from './ai.service';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}
  @Get('messages') findMessages() { return this.ai.findMessages(); }
  @Post('messages') send(@Body() dto: SendMessageDto) { return this.ai.send(dto); }
  @Delete('messages') clear() { return this.ai.clearMessages(); }
}

import { IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString() content!: string;
  @IsOptional() @IsString() attachmentText?: string;
  @IsOptional() @IsString() model?: string;
}

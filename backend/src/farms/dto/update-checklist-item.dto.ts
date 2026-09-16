import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional() @IsDateString() documentDate?: string | null;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsOptional() @IsString() renewalComments?: string | null;
  @IsOptional() @IsDateString() renewalDate?: string | null;
  @IsOptional() @IsString() documentStatus?: string | null;
}

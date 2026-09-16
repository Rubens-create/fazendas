import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateObligationDto {
  @IsString() title!: string;
  @IsDateString() dueDate!: string;
  @IsIn(['baixa', 'media', 'alta']) priority!: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() farmId?: string;
}

export class UpdateObligationDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsIn(['baixa', 'media', 'alta']) priority?: string;
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() farmId?: string;
}

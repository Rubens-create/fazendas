import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateFarmDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsNumber() @Min(0) areaHectares?: number;
  @IsOptional() @IsString() culture?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() coverImage?: string;
}

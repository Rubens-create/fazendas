import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFarmDto {
  @IsString() name!: string;
  @IsString() location!: string;
  @IsNumber() @Min(0) areaHectares!: number;
  @IsString() culture!: string;
  @IsString() status!: string;
  @IsOptional() coverImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) propertyChecklist?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) environmentalChecklist?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) livestockChecklist?: string[];
}

import { IsArray, IsString } from 'class-validator';

export class UpdateChecklistDto {
  @IsArray() @IsString({ each: true }) property!: string[];
  @IsArray() @IsString({ each: true }) environmental!: string[];
  @IsArray() @IsString({ each: true }) livestock!: string[];
}

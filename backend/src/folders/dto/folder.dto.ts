import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFolderDto {
  @IsString() name!: string;
  @IsString() icon!: string;
  @IsString() colorClass!: string;
  @IsOptional() @IsUUID() farmId?: string;
  @IsOptional() @IsUUID() parentFolderId?: string;
}

export class MoveFolderDto {
  @IsOptional() @IsUUID() farmId?: string;
  @IsOptional() @IsUUID() parentFolderId?: string;
}

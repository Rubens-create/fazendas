import { IsOptional, IsUUID } from 'class-validator';

export class MoveDocumentDto {
  @IsOptional() @IsUUID() folderId?: string;
  @IsOptional() @IsUUID() farmId?: string;
}

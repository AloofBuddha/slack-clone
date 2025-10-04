import { IsString, IsUUID, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateChannelDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

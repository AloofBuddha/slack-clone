import { IsString, IsUUID, IsOptional, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  channelId: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

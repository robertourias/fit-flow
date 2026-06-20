import { ApiProperty } from "@nestjs/swagger";
import type { Message } from "../../domain/message.entity";

export class MessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  relationshipId!: string;

  @ApiProperty()
  senderId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdAt!: string;

  static fromEntity(message: Message): MessageDto {
    const dto = new MessageDto();
    dto.id = message.id;
    dto.relationshipId = message.relationshipId;
    dto.senderId = message.senderId;
    dto.content = message.content;
    dto.createdAt = message.createdAt.toISOString();
    return dto;
  }
}

export class ListMessagesResponseDto {
  @ApiProperty({ type: [MessageDto] })
  items!: MessageDto[];

  @ApiProperty()
  total!: number;
}

export class MarkMessagesReadResponseDto {
  @ApiProperty()
  lastReadAt!: string;
}

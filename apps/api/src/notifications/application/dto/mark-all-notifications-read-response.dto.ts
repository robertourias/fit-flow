import { ApiProperty } from "@nestjs/swagger";

export class MarkAllNotificationsReadResponseDto {
  @ApiProperty()
  updated!: number;
}

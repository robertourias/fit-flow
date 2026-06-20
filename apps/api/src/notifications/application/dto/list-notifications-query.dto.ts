import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ description: "Filtra apenas notificações não lidas" })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unread?: boolean;
}

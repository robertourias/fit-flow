import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { RelationshipStatus } from "../../../identity/domain/relationship-status.enum";

export class FindRelationshipsQueryDto {
  @ApiPropertyOptional({ enum: RelationshipStatus })
  @IsOptional()
  @IsEnum(RelationshipStatus)
  status?: RelationshipStatus;
}

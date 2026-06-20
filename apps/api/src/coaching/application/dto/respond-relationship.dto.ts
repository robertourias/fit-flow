import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty } from "class-validator";

export type RespondRelationshipActionInput = "ACCEPT" | "REJECT" | "REVOKE";

export class RespondRelationshipDto {
  @ApiProperty({ enum: ["ACCEPT", "REJECT", "REVOKE"] })
  @IsIn(["ACCEPT", "REJECT", "REVOKE"])
  @IsNotEmpty()
  action!: RespondRelationshipActionInput;
}

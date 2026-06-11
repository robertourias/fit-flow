import { ApiProperty } from "@nestjs/swagger";
import { Plan } from "../../domain/plan.enum";
import type { User } from "../../domain/user.entity";

export class UserMeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true, type: String })
  bio!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  age!: number | null;

  @ApiProperty({ type: [String] })
  goals!: string[];

  @ApiProperty()
  isTrainer!: boolean;

  @ApiProperty({ enum: Plan })
  plan!: Plan;

  @ApiProperty()
  hasOnboarded!: boolean;

  @ApiProperty()
  createdAt!: string;

  static fromEntity(user: User): UserMeDto {
    const dto = new UserMeDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.avatarUrl = user.avatarUrl ?? null;
    dto.bio = user.bio ?? null;
    dto.age = user.age ?? null;
    dto.goals = user.goals;
    dto.isTrainer = user.isTrainer;
    dto.plan = user.plan;
    dto.hasOnboarded = user.hasOnboarded;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}

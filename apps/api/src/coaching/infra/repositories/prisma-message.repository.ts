import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import { IMessageRepository } from "../../domain/repositories/message.repository.interface";
import { Message } from "../../domain/message.entity";

type MessageRow = Prisma.MessageGetPayload<Record<string, never>>;

@Injectable()
export class PrismaMessageRepository implements IMessageRepository {
  async create(data: {
    relationshipId: string;
    senderId: string;
    content: string;
  }): Promise<Message> {
    const row = await prisma.message.create({ data });
    return this.toDomain(row);
  }

  async findByRelationship(
    relationshipId: string,
    opts: { limit: number; offset: number },
  ): Promise<Message[]> {
    const rows = await prisma.message.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: opts.limit,
      skip: opts.offset,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async countByRelationship(relationshipId: string): Promise<number> {
    return prisma.message.count({ where: { relationshipId } });
  }

  private toDomain(row: MessageRow): Message {
    return new Message({
      id: row.id,
      relationshipId: row.relationshipId,
      senderId: row.senderId,
      content: row.content,
      createdAt: row.createdAt,
    });
  }
}

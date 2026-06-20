import { Message } from "../message.entity";

export interface IMessageRepository {
  create(data: { relationshipId: string; senderId: string; content: string }): Promise<Message>;
  findByRelationship(
    relationshipId: string,
    opts: { limit: number; offset: number },
  ): Promise<Message[]>;
  countByRelationship(relationshipId: string): Promise<number>;
}

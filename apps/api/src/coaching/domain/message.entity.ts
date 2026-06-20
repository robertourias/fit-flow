export interface IMessageProps {
  id: string;
  relationshipId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export class Message {
  constructor(private readonly props: IMessageProps) {}

  get id() { return this.props.id; }
  get relationshipId() { return this.props.relationshipId; }
  get senderId() { return this.props.senderId; }
  get content() { return this.props.content; }
  get createdAt() { return this.props.createdAt; }

  wasSentBy(userId: string): boolean {
    return this.props.senderId === userId;
  }
}

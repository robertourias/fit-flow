import { PrismaMessageRepository } from "../prisma-message.repository";

const mockRow = {
  id: "msg-1",
  relationshipId: "rel-1",
  senderId: "trainer-1",
  content: "Bom treino!",
  createdAt: new Date("2026-06-18T10:00:00Z"),
};

jest.mock("@fitflow/db", () => ({
  prisma: {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
  Prisma: {},
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require("@fitflow/db");

describe("PrismaMessageRepository", () => {
  let repo: PrismaMessageRepository;

  beforeEach(() => {
    repo = new PrismaMessageRepository();
    jest.clearAllMocks();
  });

  describe("create()", () => {
    it("persists relationshipId, senderId and content", async () => {
      prisma.message.create.mockResolvedValue(mockRow);
      const message = await repo.create({
        relationshipId: "rel-1",
        senderId: "trainer-1",
        content: "Bom treino!",
      });
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { relationshipId: "rel-1", senderId: "trainer-1", content: "Bom treino!" },
      });
      expect(message.id).toBe("msg-1");
      expect(message.content).toBe("Bom treino!");
    });
  });

  describe("findByRelationship()", () => {
    it("paginates with limit/offset ordered by createdAt desc", async () => {
      prisma.message.findMany.mockResolvedValue([mockRow]);
      const messages = await repo.findByRelationship("rel-1", { limit: 20, offset: 0 });
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { relationshipId: "rel-1" },
        orderBy: { createdAt: "desc" },
        take: 20,
        skip: 0,
      });
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe("msg-1");
    });
  });

  describe("countByRelationship()", () => {
    it("counts messages scoped to the relationship", async () => {
      prisma.message.count.mockResolvedValue(3);
      const total = await repo.countByRelationship("rel-1");
      expect(prisma.message.count).toHaveBeenCalledWith({ where: { relationshipId: "rel-1" } });
      expect(total).toBe(3);
    });
  });
});

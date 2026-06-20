import { PrismaNotificationRepository } from "../prisma-notification.repository";
import { NotificationType } from "../../../domain/notification-type.enum";

const mockPayload = { relationshipId: "rel-1", messageId: "msg-1", senderId: "trainer-1" };

const mockRow = {
  id: "notif-1",
  userId: "student-1",
  type: "NEW_MESSAGE",
  payload: mockPayload,
  read: false,
  createdAt: new Date("2026-06-18T10:00:00Z"),
};

jest.mock("@fitflow/db", () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
  Prisma: {},
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require("@fitflow/db");

describe("PrismaNotificationRepository", () => {
  let repo: PrismaNotificationRepository;

  beforeEach(() => {
    repo = new PrismaNotificationRepository();
    jest.clearAllMocks();
  });

  describe("create()", () => {
    it("persists userId, type and payload", async () => {
      prisma.notification.create.mockResolvedValue(mockRow);
      const notification = await repo.create({
        userId: "student-1",
        type: NotificationType.NEW_MESSAGE,
        payload: mockPayload,
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: "student-1", type: NotificationType.NEW_MESSAGE, payload: mockPayload },
      });
      expect(notification.id).toBe("notif-1");
      expect(notification.type).toBe(NotificationType.NEW_MESSAGE);
    });
  });

  describe("findByUser()", () => {
    it("filters by read:false when unreadOnly is true", async () => {
      prisma.notification.findMany.mockResolvedValue([mockRow]);
      await repo.findByUser("student-1", { unreadOnly: true });
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "student-1", read: false },
        orderBy: { createdAt: "desc" },
      });
    });

    it("omits read filter when unreadOnly is not set", async () => {
      prisma.notification.findMany.mockResolvedValue([mockRow]);
      await repo.findByUser("student-1");
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "student-1" },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("markRead()", () => {
    it("marks as read when notification belongs to the user", async () => {
      prisma.notification.findUnique.mockResolvedValue(mockRow);
      prisma.notification.update.mockResolvedValue({ ...mockRow, read: true });
      const result = await repo.markRead("notif-1", "student-1");
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { read: true },
      });
      expect(result?.read).toBe(true);
    });

    it("returns null when notification does not exist", async () => {
      prisma.notification.findUnique.mockResolvedValue(null);
      const result = await repo.markRead("missing", "student-1");
      expect(result).toBeNull();
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it("returns null when notification belongs to another user", async () => {
      prisma.notification.findUnique.mockResolvedValue(mockRow);
      const result = await repo.markRead("notif-1", "someone-else");
      expect(result).toBeNull();
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe("markAllRead()", () => {
    it("updates all unread notifications for the user and returns the count", async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 4 });
      const updated = await repo.markAllRead("student-1");
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "student-1", read: false },
        data: { read: true },
      });
      expect(updated).toBe(4);
    });
  });
});

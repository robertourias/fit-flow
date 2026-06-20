import { Notification } from "../notification.entity";
import { NotificationType } from "../notification-type.enum";

const base = {
  id: "notif-1",
  userId: "user-1",
  type: NotificationType.NEW_MESSAGE,
  payload: { relationshipId: "rel-1", messageId: "msg-1", senderId: "user-2" },
  read: false,
  createdAt: new Date("2026-06-18T10:00:00Z"),
};

describe("Notification entity", () => {
  it("exposes all props via getters", () => {
    const notification = new Notification({ ...base });
    expect(notification.id).toBe("notif-1");
    expect(notification.userId).toBe("user-1");
    expect(notification.type).toBe(NotificationType.NEW_MESSAGE);
    expect(notification.payload).toEqual(base.payload);
    expect(notification.read).toBe(false);
    expect(notification.createdAt).toEqual(new Date("2026-06-18T10:00:00Z"));
  });

  describe("belongsTo()", () => {
    it("returns true when userId matches", () => {
      const notification = new Notification({ ...base });
      expect(notification.belongsTo("user-1")).toBe(true);
    });

    it("returns false when userId does not match", () => {
      const notification = new Notification({ ...base });
      expect(notification.belongsTo("someone-else")).toBe(false);
    });
  });
});

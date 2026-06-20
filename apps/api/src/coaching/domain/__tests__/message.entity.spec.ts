import { Message } from "../message.entity";

const base = {
  id: "msg-1",
  relationshipId: "rel-1",
  senderId: "trainer-1",
  content: "Bom treino hoje!",
  createdAt: new Date("2026-06-18T10:00:00Z"),
};

describe("Message entity", () => {
  it("exposes all props via getters", () => {
    const message = new Message({ ...base });
    expect(message.id).toBe("msg-1");
    expect(message.relationshipId).toBe("rel-1");
    expect(message.senderId).toBe("trainer-1");
    expect(message.content).toBe("Bom treino hoje!");
    expect(message.createdAt).toEqual(new Date("2026-06-18T10:00:00Z"));
  });

  describe("wasSentBy()", () => {
    it("returns true when senderId matches", () => {
      const message = new Message({ ...base, senderId: "student-1" });
      expect(message.wasSentBy("student-1")).toBe(true);
    });

    it("returns false when senderId does not match", () => {
      const message = new Message({ ...base, senderId: "student-1" });
      expect(message.wasSentBy("trainer-1")).toBe(false);
    });
  });
});

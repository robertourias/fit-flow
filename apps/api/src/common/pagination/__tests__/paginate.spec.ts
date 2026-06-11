import { paginate } from "../paginate";
import type { IPaginateArgs } from "../paginate";

interface Item {
  id: string;
}

function makeItems(count: number, offset = 0): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: `item-${i + offset}` }));
}

describe("paginate", () => {
  it("returns nextCursor null when page has exactly limit items", async () => {
    const result = await paginate<Item>({
      findPage: async () => makeItems(20),
      count: async () => 20,
      limit: 20,
    });

    expect(result.items).toHaveLength(20);
    expect(result.total).toBe(20);
    expect(result.nextCursor).toBeNull();
  });

  it("trims to limit and sets nextCursor when limit+1 items returned", async () => {
    const result = await paginate<Item>({
      findPage: async () => makeItems(21),
      count: async () => 50,
      limit: 20,
    });

    expect(result.items).toHaveLength(20);
    expect(result.nextCursor).toBe("item-19");
    expect(result.total).toBe(50);
  });

  it("returns empty page with null cursor", async () => {
    const result = await paginate<Item>({
      findPage: async () => [],
      count: async () => 0,
      limit: 20,
    });

    expect(result).toEqual({ items: [], total: 0, nextCursor: null });
  });

  it("forwards cursor as prisma cursor args with skip 1", async () => {
    let receivedArgs: IPaginateArgs | undefined;
    await paginate<Item>({
      findPage: async (args) => {
        receivedArgs = args;
        return makeItems(5);
      },
      count: async () => 5,
      cursor: "item-42",
      limit: 20,
    });

    expect(receivedArgs).toEqual({ take: 21, cursor: { id: "item-42" }, skip: 1 });
  });

  it("requests without cursor use skip 0 and no cursor arg", async () => {
    let receivedArgs: IPaginateArgs | undefined;
    await paginate<Item>({
      findPage: async (args) => {
        receivedArgs = args;
        return [];
      },
      count: async () => 0,
      limit: 10,
    });

    expect(receivedArgs).toEqual({ take: 11, cursor: undefined, skip: 0 });
  });
});

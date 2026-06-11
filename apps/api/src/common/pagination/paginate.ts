import type { PaginatedResponse } from "@fitflow/types";

export interface IPaginateArgs {
  take: number;
  cursor?: { id: string };
  skip?: number;
}

export interface IPaginateOptions<T extends { id: string }> {
  findPage: (args: IPaginateArgs) => Promise<T[]>;
  count: () => Promise<number>;
  cursor?: string;
  limit: number;
}

/**
 * Paginação cursor-based sobre o cursor nativo do Prisma.
 * Busca limit+1 itens para detectar se há próxima página;
 * nextCursor é o id do último item retornado.
 */
export async function paginate<T extends { id: string }>(
  options: IPaginateOptions<T>,
): Promise<PaginatedResponse<T>> {
  const [items, total] = await Promise.all([
    options.findPage({
      take: options.limit + 1,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      // skip: 1 pula o próprio item do cursor (exclusivo)
      skip: options.cursor ? 1 : 0,
    }),
    options.count(),
  ]);

  const hasMore = items.length > options.limit;
  const page = hasMore ? items.slice(0, options.limit) : items;

  return {
    items: page,
    total,
    nextCursor: hasMore && page.length > 0 ? page[page.length - 1]!.id : null,
  };
}

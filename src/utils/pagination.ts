export const PAGE_SIZE = 50;

// The 1-based page number from ?page=, falling back to 1 for anything odd.
export function pageFrom(value: string | string[] | undefined) {
  const page = Math.floor(Number(Array.isArray(value) ? value[0] : value));
  return Number.isFinite(page) && page > 1 ? page : 1;
}

export function pageCount(total: number, size = PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / size));
}

export function pageWindow(page: number, size = PAGE_SIZE) {
  return { skip: (page - 1) * size, take: size };
}

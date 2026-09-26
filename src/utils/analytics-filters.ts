// The analytics page's filters, read from and written to its query string.
export const FILTER_KEYS = ["team", "position", "round", "test", "from", "to"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type Filters = Partial<Record<FilterKey, string>>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseFilters(params: Record<string, string | string[] | undefined> | URLSearchParams): Filters {
  const get = (key: string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    return typeof value === "string" && value.length > 0 && value.length <= 200 ? value : undefined;
  };
  const filters: Filters = {};
  for (const key of FILTER_KEYS) {
    const value = get(key);
    if (value === undefined || ((key === "from" || key === "to") && !DATE.test(value))) continue;
    filters[key] = value;
  }
  return filters;
}

export function filtersToQuery(filters: Filters) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    if (filters[key]) params.set(key, filters[key]!);
  }
  return params.toString();
}

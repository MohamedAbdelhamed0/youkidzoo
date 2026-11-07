/** Read complete result sets instead of silently accepting the backend row cap. */
export async function readPages<T>(
  load: (
    start: number,
    end: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 500,
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1)
    throw new Error("Page size must be a positive integer.");
  const rows: T[] = [];
  for (let start = 0; ;) {
    const { data, error } = await load(start, start + pageSize - 1);
    if (error) throw error;
    const page = data || [];
    if (!page.length) return rows;
    rows.push(...page);
    start += page.length;
  }
}

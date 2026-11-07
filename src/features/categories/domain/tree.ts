import type { Category } from "./Category";
export function categoryDepth(
  category: Category,
  categories: Category[],
): number {
  const index = new Map(categories.map((c) => [c.id, c]));
  const visited = new Set([category.id]);
  let parent = category.parentId,
    depth = 0;
  while (parent && index.has(parent) && !visited.has(parent)) {
    visited.add(parent);
    depth++;
    parent = index.get(parent)!.parentId;
  }
  return depth;
}
export function orderCategories(categories: Category[]): Category[] {
  const sorted = [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  );
  const ids = new Set(sorted.map((c) => c.id));
  const children = new Map<string, Category[]>();
  for (const category of sorted)
    if (category.parentId) {
      const siblings = children.get(category.parentId) || [];
      siblings.push(category);
      children.set(category.parentId, siblings);
    }
  const roots = sorted.filter((c) => !c.parentId || !ids.has(c.parentId));
  const visited = new Set<string>(),
    result: Category[] = [];
  for (const root of [...roots, ...sorted]) {
    const stack = [root];
    while (stack.length) {
      const category = stack.pop()!;
      if (visited.has(category.id)) continue;
      visited.add(category.id);
      result.push(category);
      stack.push(...(children.get(category.id) || []).slice().reverse());
    }
  }
  return result;
}

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { expect, it } from "vitest";
const root = fileURLToPath(new URL("../", import.meta.url));
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}
const files = walk(root).filter(
  (file) => /\.(ts|tsx)$/.test(file) && !file.includes(".test."),
);
const imports = (file: string) =>
  [
    ...readFileSync(file, "utf8").matchAll(
      /(?:from\s+|import\s*)['"]([^'"]+)['"]/g,
    ),
  ].map((match) => match[1]);
it("keeps domains independent of UI, infrastructure, and browser APIs", () => {
  const violations: string[] = [];
  for (const file of files.filter((f) =>
    f.replaceAll("\\", "/").includes("/domain/"),
  )) {
    for (const dependency of imports(file))
      if (
        /react|zustand|supabase|\/(data|controllers|presentation|app|core)\//.test(
          dependency,
        )
      )
        violations.push(`${relative(root, file)} -> ${dependency}`);
    if (
      /\b(window|document|HTMLElement|File|Blob)\b/.test(
        readFileSync(file, "utf8"),
      )
    )
      violations.push(relative(root, file) + " depends on a browser API");
  }
  expect(violations).toEqual([]);
});
it("allows backend SDK imports only in configured clients and data sources", () => {
  const violations = files
    .filter(
      (file) =>
        imports(file).some((value) => value.includes("@supabase/")) &&
        !file.replaceAll("\\", "/").includes("/data/datasources/") &&
        !file.replaceAll("\\", "/").includes("/core/config/"),
    )
    .map((file) => relative(root, file));
  expect(violations).toEqual([]);
});
it("keeps feature presentation independent of repositories and data sources", () => {
  const violations: string[] = [];
  for (const file of files.filter((f) =>
    f.replaceAll("\\", "/").includes("/presentation/"),
  ))
    for (const dependency of imports(file))
      if (/\/(data|di)\//.test(dependency))
        violations.push(`${relative(root, file)} -> ${dependency}`);
  expect(violations).toEqual([]);
});

import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

const script = readFileSync(
  new URL("../../public/restore-route.js", import.meta.url),
  "utf8",
);
function restore(href: string) {
  const replaceState = vi.fn();
  runInNewContext(script, {
    URL,
    window: { location: { href }, history: { replaceState } },
  });
  return replaceState;
}
it("restores deep links with query parameters and an Auth callback fragment", () => {
  const path = "/youkidzoo/account?view=profile";
  const replace = restore(
    `https://example.github.io/youkidzoo/?__youkidzoo_route=${encodeURIComponent(path)}#access_token=example`,
  );
  expect(replace).toHaveBeenCalledWith(
    null,
    "",
    path + "#access_token=example",
  );
});
it("does not navigate to another origin or outside the repository path", () => {
  for (const path of [
    "//evil.example/account",
    "/another-app/account",
    "/youkidzoo/../another-app",
  ]) {
    expect(
      restore(
        `https://example.github.io/youkidzoo/?__youkidzoo_route=${encodeURIComponent(path)}`,
      ),
    ).not.toHaveBeenCalled();
  }
  expect(
    restore("https://example.github.io/youkidzoo/shop"),
  ).not.toHaveBeenCalled();
});

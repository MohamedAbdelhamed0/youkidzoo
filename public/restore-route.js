// GitHub Pages serves 404.html for deep links. Restore the route before React
// starts, preserving query parameters and Auth callback fragments.
(() => {
  const url = new URL(window.location.href);
  const route = url.searchParams.get("__youkidzoo_route");
  if (!route || !route.startsWith("/") || route.startsWith("//")) return;
  const target = new URL(route, url.origin);
  if (target.origin !== url.origin || !target.pathname.startsWith(url.pathname))
    return;
  window.history.replaceState(
    null,
    "",
    target.pathname + target.search + url.hash,
  );
})();

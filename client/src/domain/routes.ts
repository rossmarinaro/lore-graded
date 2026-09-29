const collectorRoutes: Record<string, string> = {
  submit: "/account/",
  orders: "/account/orders.html",
  queue: "/weekly-queue",
  scan: "/verify",
  home: "/",
  founders: "/gold-club/",
};
export function resolveClientRoute(
  destination: string,
  currentPath = "/",
): string {
  const url = new URL(
    destination,
    "https://lore-refactor.invalid" + currentPath,
  );
  if (url.pathname.endsWith("/collector.html"))
    return collectorRoutes[url.hash.slice(1)] ?? url.pathname + url.hash;
  return url.pathname + url.search + url.hash;
}
export function isExternalDestination(destination: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(destination);
}
export function isPermittedExternalDestination(destination: string): boolean {
  return /^(https?:\/\/|mailto:|tel:)/i.test(destination);
}
export function contentPathForRoute(route: string): string {
  const pathname = route.split(/[?#]/)[0];
  return pathname.endsWith("/") ? pathname + "index.html" : pathname;
}

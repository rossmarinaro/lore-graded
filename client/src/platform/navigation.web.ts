export function readInitialRoute(): string {
  return (
    window.location.pathname + window.location.search + window.location.hash
  );
}
export function writeRoute(route: string): void {
  window.history.pushState(null, "", route);
}
export function subscribeToNavigation(
  onRoute: (route: string) => void,
): () => void {
  const handle = () => onRoute(readInitialRoute());
  window.addEventListener("popstate", handle);
  window.addEventListener("hashchange", handle);
  return () => {
    window.removeEventListener("popstate", handle);
    window.removeEventListener("hashchange", handle);
  };
}

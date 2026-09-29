import { Linking } from "react-native";
export function readInitialRoute(): string {
  return "/";
}
export function writeRoute(_route: string): void {}
export function subscribeToNavigation(
  onRoute: (route: string) => void,
): () => void {
  const subscription = Linking.addEventListener("url", ({ url }) => {
    const parsed = new URL(url);
    onRoute("/" + parsed.host + parsed.pathname + parsed.hash);
  });
  return () => subscription.remove();
}

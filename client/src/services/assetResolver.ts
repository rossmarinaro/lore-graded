import { Platform } from "react-native";
const configuredAssetOrigin =
  process.env.EXPO_PUBLIC_ASSET_ORIGIN?.replace(/\/$/, "") ?? "";
export function resolveAssetUri(
  source: string,
  pagePath = "/index.html",
): string {
  if (/^https?:\/\//i.test(source)) return source;
  if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(source)) return source;
  const resolved = new URL(source, "https://local-assets.invalid" + pagePath);
  if (
    resolved.protocol !== "https:" ||
    resolved.host !== "local-assets.invalid"
  )
    return "";
  const assetPath = resolved.pathname + resolved.search;
  return configuredAssetOrigin + assetPath;
}
export function assetConfigurationWarning(): string | null {
  return Platform.OS !== "web" && !configuredAssetOrigin
    ? "Set EXPO_PUBLIC_ASSET_ORIGIN to your computer’s local asset server before testing images on a device."
    : null;
}

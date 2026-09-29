import * as ImagePicker from "expo-image-picker";
export async function chooseCardPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    base64: true,
  });
  if (result.canceled) return null;
  const photo = result.assets[0];
  if (!photo.base64) throw Error("Photo could not be read.");
  if (photo.base64.length > 5_000_000)
    throw Error("Choose a smaller image (under approximately 3.5 MB).");
  return `data:${photo.mimeType ?? "image/jpeg"};base64,${photo.base64}`;
}

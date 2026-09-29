import AsyncStorage from "@react-native-async-storage/async-storage";
// Separate namespace: never read or overwrite the original website's Locker.
const REVIEW_DRAFT_STORAGE_KEY = "lore.refactor.review.drafts.v1";
export const draftStorage = {
  read: () => AsyncStorage.getItem(REVIEW_DRAFT_STORAGE_KEY),
  write: (serialized: string) =>
    AsyncStorage.setItem(REVIEW_DRAFT_STORAGE_KEY, serialized),
};

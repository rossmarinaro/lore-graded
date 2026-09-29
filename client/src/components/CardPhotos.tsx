import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { ActionButton } from "./Controls";
import { styles } from "./theme";
import { chooseCardPhoto } from "../platform/photoPicker";
import { useSubmissionDrafts } from "../contexts/SubmissionDraftContext";
import type { DraftCard } from "../domain/types";
export function CardPhotos({
  card,
  draftId,
}: {
  card: DraftCard;
  draftId: string;
}) {
  const { dispatchDraftAction } = useSubmissionDrafts();
  const [photoError, setPhotoError] = useState("");
  const [isPickingPhoto, setPickingPhoto] = useState(false);
  async function choosePhoto(side: "front" | "back") {
    setPickingPhoto(true);
    setPhotoError("");
    try {
      const photoUri = await chooseCardPhoto();
      if (photoUri)
        dispatchDraftAction({
          type: "setCardPhoto",
          draftId,
          cardId: card.localCardId,
          side,
          photoUri,
          now: new Date().toISOString(),
        });
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "Photo unavailable.",
      );
    } finally {
      setPickingPhoto(false);
    }
  }
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        {(["front", "back"] as const).map((side) => (
          <View key={side} style={{ flex: 1, minWidth: 120, gap: 8 }}>
            {card[side === "front" ? "frontPhotoUri" : "backPhotoUri"] && (
              <Image
                source={{
                  uri: card[
                    side === "front" ? "frontPhotoUri" : "backPhotoUri"
                  ],
                }}
                accessibilityLabel={`${card.player} ${side}`}
                style={{ width: "100%", height: 160 }}
                resizeMode="contain"
              />
            )}
            <ActionButton
              secondary
              disabled={isPickingPhoto}
              label={`Choose ${side} photo`}
              onPress={() => void choosePhoto(side)}
            />
          </View>
        ))}
      </View>
      {!!photoError && <Text style={styles.error}>{photoError}</Text>}
      <Text style={styles.muted}>
        Photos remain in this review’s device storage. Large photo collections
        can exceed browser storage limits.
      </Text>
    </View>
  );
}

import { CardPhotos } from "../components/CardPhotos";
import React, { useState } from "react";
import { Text, View, Alert } from "react-native";
import {
  Panel,
  Field,
  ActionButton,
  ChoicePicker,
} from "../components/Controls";
import { styles } from "../components/theme";
import { useSubmissionDrafts } from "../contexts/SubmissionDraftContext";
import { useNavigation } from "../contexts/NavigationContext";
import type { CardDetails, ServiceLevel } from "../domain/types";
import { CatalogScreen } from "./CatalogScreen";
const emptyCard: CardDetails = {
  player: "",
  sport: "",
  year: "",
  set: "",
  cardNumber: "",
  language: "en",
  parallel: "",
};
const fieldLabels: Record<keyof CardDetails, string> = {
  player: "Card / character name",
  sport: "Collection / game",
  year: "Printed year",
  set: "Set",
  cardNumber: "Card number",
  language: "Printed language",
  parallel: "Variation / finish",
  manufacturer: "Manufacturer",
};
function identifier() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
export function SubmissionScreen() {
  const {
    draftWorkspace,
    selectedDraft,
    isDraftStorageReady,
    draftStorageError,
    dispatchDraftAction,
  } = useSubmissionDrafts();
  const { navigateTo } = useNavigation();
  const [manualCard, setManualCard] = useState(emptyCard);
  const [isCatalogVisible, setCatalogVisible] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  function addCard(card: CardDetails) {
    const cardQuantity = Number(quantity);
    if (!selectedDraft) return;
    if (!card.player.trim()) {
      setMessage("A card name is required.");
      return;
    }
    if (
      !Number.isInteger(cardQuantity) ||
      cardQuantity < 1 ||
      cardQuantity > 10 ||
      selectedDraft.cards.length + cardQuantity > 10
    ) {
      setMessage(
        "Choose a quantity that keeps your draft at 10 cards or fewer.",
      );
      return;
    }
    dispatchDraftAction({
      type: "addCards",
      draftId: selectedDraft.localDraftId,
      cards: Array.from({ length: cardQuantity }, () => ({
        ...card,
        localCardId: identifier(),
      })),
      now: new Date().toISOString(),
    });
    setMessage(
      `${cardQuantity} card${cardQuantity === 1 ? "" : "s"} added to your local draft.`,
    );
    setManualCard(emptyCard);
  }
  return (
    <View style={{ gap: 20 }}>
      <Text style={styles.title}>My submissions</Text>
      <Text style={styles.body}>
        Review copy: drafts save on this device only. No queue place, account
        draft, or payment is created.
      </Text>
      {draftStorageError && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {draftStorageError}
        </Text>
      )}
      <ActionButton
        label="New local draft"
        disabled={!isDraftStorageReady || draftWorkspace.drafts.length >= 20}
        onPress={() =>
          dispatchDraftAction({
            type: "createDraft",
            draftId: identifier(),
            now: new Date().toISOString(),
          })
        }
      />
      <View style={styles.row}>
        {draftWorkspace.drafts.map((draft) => (
          <ActionButton
            secondary
            key={draft.localDraftId}
            label={`${draft.title} (${draft.cards.length}/10)`}
            onPress={() => {
              dispatchDraftAction({
                type: "selectDraft",
                draftId: draft.localDraftId,
              });
              setDeleteConfirmation(false);
            }}
          />
        ))}
      </View>
      {selectedDraft && (
        <>
          <Panel>
            <Field
              label="Draft title"
              value={selectedDraft.title}
              onChangeText={(title) =>
                dispatchDraftAction({
                  type: "renameDraft",
                  draftId: selectedDraft.localDraftId,
                  title,
                  now: new Date().toISOString(),
                })
              }
            />
            <Text style={styles.heading}>
              {selectedDraft.cards.length} / 10 cards
            </Text>
            {selectedDraft.cards.map((card) => (
              <Panel key={card.localCardId}>
                <Text style={styles.heading}>{card.player}</Text>
                <Text style={styles.body}>
                  {[
                    card.sport,
                    card.set,
                    card.cardNumber,
                    card.year,
                    card.parallel,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                <CardPhotos card={card} draftId={selectedDraft.localDraftId} />
                <ActionButton
                  secondary
                  label={`Remove ${card.player}`}
                  onPress={() =>
                    dispatchDraftAction({
                      type: "removeCard",
                      draftId: selectedDraft.localDraftId,
                      cardId: card.localCardId,
                      now: new Date().toISOString(),
                    })
                  }
                />
              </Panel>
            ))}
            <ChoicePicker
              label="Service preference"
              value={selectedDraft.serviceLevel}
              options={[
                { value: "standard", label: "Standard · $50/card" },
                { value: "express", label: "Express · $75/card" },
                {
                  value: "founders",
                  label: "Founders · $125/card · eligibility required",
                },
              ]}
              onSelect={(serviceLevel) =>
                dispatchDraftAction({
                  type: "setServiceLevel",
                  draftId: selectedDraft.localDraftId,
                  serviceLevel: serviceLevel as ServiceLevel,
                  now: new Date().toISOString(),
                })
              }
            />
            <ActionButton
              label="Review draft costs"
              onPress={() => navigateTo("/account/orders.html")}
            />
            <ActionButton
              secondary
              label={
                deleteConfirmation
                  ? "Confirm delete local draft"
                  : "Delete local draft"
              }
              onPress={() => {
                if (deleteConfirmation) {
                  dispatchDraftAction({
                    type: "deleteDraft",
                    draftId: selectedDraft.localDraftId,
                  });
                  setDeleteConfirmation(false);
                } else setDeleteConfirmation(true);
              }}
            />
            {deleteConfirmation && (
              <ActionButton
                secondary
                label="Cancel deletion"
                onPress={() => setDeleteConfirmation(false)}
              />
            )}
          </Panel>
          <Panel>
            <Text style={styles.heading}>Add a card</Text>
            <Field
              label="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <ActionButton
              secondary
              label={
                isCatalogVisible
                  ? "Hide catalogue"
                  : "Browse original catalogue"
              }
              onPress={() => setCatalogVisible(!isCatalogVisible)}
            />
            {isCatalogVisible && <CatalogScreen onChooseCard={addCard} />}
            <Text style={styles.body}>Or enter the printed details:</Text>
            {(Object.keys(emptyCard) as (keyof CardDetails)[]).map((field) => (
              <Field
                key={field}
                label={fieldLabels[field]}
                value={manualCard[field] ?? ""}
                onChangeText={(value) =>
                  setManualCard((current) => ({ ...current, [field]: value }))
                }
              />
            ))}
            <ActionButton
              label="Add to draft"
              disabled={selectedDraft.cards.length >= 10}
              onPress={() => addCard(manualCard)}
            />
            <Text accessibilityLiveRegion="polite" style={styles.body}>
              {message}
            </Text>
          </Panel>
        </>
      )}
    </View>
  );
}

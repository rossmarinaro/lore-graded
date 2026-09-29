import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  Panel,
  Field,
  ChoicePicker,
  ActionButton,
} from "../components/Controls";
import { styles } from "../components/theme";
import {
  loadCatalogLanguages,
  loadCatalogSets,
  loadCardsForSet,
} from "../services/catalogService";
import type { CardDetails, CatalogSet } from "../domain/types";
export function CatalogScreen({
  onChooseCard,
}: {
  onChooseCard: (card: CardDetails) => void;
}) {
  const [language, setLanguage] = useState("en");
  const [languages, setLanguages] = useState<Record<string, number>>({ en: 0 });
  const [catalogSets, setCatalogSets] = useState<CatalogSet[]>([]);
  const [franchise, setFranchise] = useState("");
  const [selectedSetIndex, setSelectedSetIndex] = useState("");
  const [cards, setCards] = useState<CardDetails[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setCards([]);
    setCatalogSets([]);
    setFranchise("");
    setSelectedSetIndex("");
    Promise.all([
      loadCatalogLanguages(controller.signal),
      loadCatalogSets(language, controller.signal),
    ])
      .then(([availableLanguages, sets]) => {
        if (!controller.signal.aborted) {
          setLanguages(availableLanguages);
          setCatalogSets(sets);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [language, retryCount]);
  useEffect(() => {
    setCards([]);
    if (!selectedSetIndex) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    loadCardsForSet(
      catalogSets[Number(selectedSetIndex) - 1],
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setCards(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedSetIndex, catalogSets]);
  const matchingCards = cards.filter((card) =>
    `${card.player} ${card.cardNumber} ${card.parallel}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Panel>
      <Text style={styles.heading}>Find your card</Text>
      <ChoicePicker
        label="Printed language"
        value={language}
        options={Object.keys(languages).map((code) => ({
          value: code,
          label: code === "en" ? "English + unconfirmed" : code,
        }))}
        onSelect={setLanguage}
      />
      <ChoicePicker
        label="Franchise / game"
        value={franchise}
        options={[...new Set(catalogSets.map((set) => set.sport))]
          .sort()
          .map((value) => ({ value, label: value }))}
        onSelect={(value) => {
          setFranchise(value);
          setSelectedSetIndex("");
        }}
        disabled={isLoading}
      />
      <ChoicePicker
        label="Set / year / manufacturer"
        value={selectedSetIndex}
        options={catalogSets
          .map((set, index) => ({ set, index }))
          .filter((item) => item.set.sport === franchise)
          .map(({ set, index }) => ({
            value: String(index + 1),
            label: `${set.set} · ${set.year} · ${set.manufacturer}`,
          }))}
        onSelect={setSelectedSetIndex}
        disabled={!franchise || isLoading}
      />
      <Field
        label="Search card name, number or finish"
        value={query}
        onChangeText={setQuery}
      />
      {isLoading && <ActivityIndicator color="#efcf87" />}
      {!!error && (
        <>
          <Text style={styles.error}>{error}</Text>
          <ActionButton
            secondary
            label="Retry catalogue"
            onPress={() => setRetryCount((count) => count + 1)}
          />
        </>
      )}
      <Text style={styles.muted}>
        {matchingCards.length} matching cards
        {matchingCards.length > 50
          ? " · showing first 50; refine your search"
          : ""}
      </Text>
      {matchingCards.slice(0, 50).map((card, index) => (
        <ActionButton
          key={index}
          secondary
          label={`${card.player} · ${card.cardNumber} · ${card.parallel || "Base"}`}
          onPress={() => onChooseCard(card)}
        />
      ))}
      <Text style={styles.muted}>
        Confirm language, edition and finish. A catalogue match does not confirm
        grading eligibility.
      </Text>
    </Panel>
  );
}

import { gunzipSync, strFromU8 } from "fflate";
import { resolveAssetUri } from "./assetResolver";
import type { CardDetails, CatalogSet } from "../domain/types";
interface CatalogMetadata {
  report: { languages: Record<string, number> };
}
interface SetIndexFile {
  fields: string[];
  groups: { values: unknown[]; count: number; parts: string[] }[];
}
interface CatalogPart {
  fields: string[];
  constants: Record<string, unknown>;
  rows: unknown[][];
}
async function readCatalogFile<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(resolveAssetUri(path), { signal });
  if (!response.ok)
    throw Error(
      "Catalogue file unavailable. Import the original public assets first.",
    );
  const bytes = new Uint8Array(await response.arrayBuffer());
  return JSON.parse(
    strFromU8(bytes[0] === 31 && bytes[1] === 139 ? gunzipSync(bytes) : bytes),
  ) as T;
}
export async function loadCatalogLanguages(
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  return (await readCatalogFile<CatalogMetadata>("/catalog/cards.json", signal))
    .report.languages;
}
export async function loadCatalogSets(
  language: string,
  signal?: AbortSignal,
): Promise<CatalogSet[]> {
  const languages = language === "en" ? ["en", "und"] : [language];
  const results: CatalogSet[] = [];
  for (const code of languages) {
    const index = await readCatalogFile<SetIndexFile>(
      `/catalog/sets/${encodeURIComponent(code)}.json.gz`,
      signal,
    );
    for (const group of index.groups)
      results.push({
        ...Object.fromEntries(
          index.fields.map((field, position) => [
            field,
            group.values[position],
          ]),
        ),
        count: group.count,
        parts: group.parts,
      } as CatalogSet);
  }
  return results;
}
export async function loadCardsForSet(
  selectedSet: CatalogSet,
  signal?: AbortSignal,
): Promise<CardDetails[]> {
  const cards: CardDetails[] = [];
  for (const path of new Set(selectedSet.parts)) {
    const part = await readCatalogFile<CatalogPart>(path, signal);
    for (const values of part.rows) {
      const card: Record<string, unknown> = { ...part.constants };
      part.fields.forEach((field, index) => {
        if (values[index] !== null) card[field] = values[index];
      });
      if (
        ["sport", "year", "manufacturer", "set"].every(
          (field) =>
            !selectedSet[field] ||
            String(card[field] ?? "") === String(selectedSet[field]),
        )
      ) {
        cards.push(
          Object.fromEntries(
            [
              "player",
              "sport",
              "year",
              "manufacturer",
              "set",
              "cardNumber",
              "language",
              "parallel",
            ].map((field) => [field, String(card[field] ?? "")]),
          ) as unknown as CardDetails,
        );
      }
    }
  }
  if (cards.length !== selectedSet.count)
    throw Error("The complete set could not be loaded. Please retry.");
  return cards;
}

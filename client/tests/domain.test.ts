import test from "node:test";
import assert from "node:assert/strict";
import {
  draftWorkspaceReducer,
  initialDraftWorkspace,
  parseDraftWorkspace,
} from "../src/domain/drafts";
import {
  nextSundayDropTimestamp,
  PUBLIC_LAUNCH_TIMESTAMP,
} from "../src/domain/queueClock";
import { resolveClientRoute } from "../src/domain/routes";
const card = {
  localCardId: "card-1",
  player: "Charizard",
  sport: "Pokémon",
  year: "1999",
  set: "Base Set",
  cardNumber: "4/102",
  language: "en",
  parallel: "",
};
test("enforces ten cards without mutating prior draft", () => {
  const empty = draftWorkspaceReducer(initialDraftWorkspace, {
    type: "createDraft",
    draftId: "draft-1",
    now: "2026-09-29",
  });
  const full = draftWorkspaceReducer(empty, {
    type: "addCards",
    draftId: "draft-1",
    cards: Array.from({ length: 10 }, (_, index) => ({
      ...card,
      localCardId: String(index),
    })),
    now: "2026-09-29",
  });
  assert.equal(empty.drafts[0].cards.length, 0);
  assert.equal(full.drafts[0].cards.length, 10);
  assert.throws(
    () =>
      draftWorkspaceReducer(full, {
        type: "addCards",
        draftId: "draft-1",
        cards: [card],
        now: "2026-09-29",
      }),
    /at most 10/,
  );
});
test("rejects malformed persisted draft data", () => {
  assert.deepEqual(parseDraftWorkspace("{bad"), initialDraftWorkspace);
  assert.deepEqual(
    parseDraftWorkspace(
      JSON.stringify({ drafts: [{ localDraftId: "bad", cards: [] }] }),
    ),
    initialDraftWorkspace,
  );
});
test("does not expose queue drop before launch", () =>
  assert.equal(
    nextSundayDropTimestamp(Date.parse("2026-09-29T17:00:00Z")),
    PUBLIC_LAUNCH_TIMESTAMP,
  ));
test("Sunday scheduling handles daylight savings", () => {
  assert.equal(
    new Date(
      nextSundayDropTimestamp(Date.parse("2027-03-13T17:00:00Z")),
    ).toISOString(),
    "2027-03-15T00:00:00.000Z",
  );
  assert.equal(
    new Date(
      nextSundayDropTimestamp(Date.parse("2027-11-06T17:00:00Z")),
    ).toISOString(),
    "2027-11-08T01:00:00.000Z",
  );
});
test("legacy collector anchors route to dedicated screens", () => {
  assert.equal(
    resolveClientRoute("/website/collector.html#submit"),
    "/account/",
  );
  assert.equal(resolveClientRoute("/website/collector.html#scan"), "/verify");
});

import type { DraftAction, DraftWorkspaceState } from "./types";
export const MAXIMUM_CARDS_PER_DRAFT = 10;
export const MAXIMUM_SAVED_DRAFTS = 20;
export const initialDraftWorkspace: DraftWorkspaceState = {
  drafts: [],
  selectedDraftId: null,
};
export function draftWorkspaceReducer(
  state: DraftWorkspaceState,
  action: DraftAction,
): DraftWorkspaceState {
  if (action.type === "restoreWorkspace") return action.workspace;
  if (action.type === "createDraft") {
    if (state.drafts.length >= MAXIMUM_SAVED_DRAFTS)
      throw new Error("You can save up to 20 drafts.");
    return {
      selectedDraftId: action.draftId,
      drafts: [
        ...state.drafts,
        {
          localDraftId: action.draftId,
          title: "My LORE submission",
          cards: [],
          serviceLevel: "standard",
          updatedAt: action.now,
        },
      ],
    };
  }
  if (action.type === "selectDraft") {
    if (!state.drafts.some((d) => d.localDraftId === action.draftId))
      throw new Error("Draft not found.");
    return { ...state, selectedDraftId: action.draftId };
  }
  if (action.type === "deleteDraft") {
    const drafts = state.drafts.filter(
      (d) => d.localDraftId !== action.draftId,
    );
    return {
      drafts,
      selectedDraftId:
        state.selectedDraftId === action.draftId
          ? (drafts[0]?.localDraftId ?? null)
          : state.selectedDraftId,
    };
  }
  return {
    ...state,
    drafts: state.drafts.map((draft) => {
      if (draft.localDraftId !== action.draftId) return draft;
      const updated = { ...draft, updatedAt: action.now };
      switch (action.type) {
        case "setCardPhoto":
          return {
            ...updated,
            cards: draft.cards.map((card) =>
              card.localCardId === action.cardId
                ? {
                    ...card,
                    [action.side === "front"
                      ? "frontPhotoUri"
                      : "backPhotoUri"]: action.photoUri,
                  }
                : card,
            ),
          };
        case "renameDraft":
          return { ...updated, title: action.title.slice(0, 100) };
        case "setServiceLevel":
          return { ...updated, serviceLevel: action.serviceLevel };
        case "removeCard":
          return {
            ...updated,
            cards: draft.cards.filter(
              (card) => card.localCardId !== action.cardId,
            ),
          };
        case "addCards":
          if (draft.cards.length + action.cards.length > 10)
            throw new Error("A draft can contain at most 10 cards.");
          if (action.cards.some((card) => !card.player.trim()))
            throw new Error("A card name is required.");
          return { ...updated, cards: [...draft.cards, ...action.cards] };
      }
    }),
  };
}
export function parseDraftWorkspace(
  serialized: string | null,
): DraftWorkspaceState {
  if (!serialized) return initialDraftWorkspace;
  try {
    const value: unknown = JSON.parse(serialized);
    if (
      !value ||
      typeof value !== "object" ||
      !("drafts" in value) ||
      !Array.isArray(value.drafts) ||
      value.drafts.length > 20
    )
      return initialDraftWorkspace;
    for (const draft of value.drafts) {
      if (
        !draft ||
        typeof draft.localDraftId !== "string" ||
        typeof draft.title !== "string" ||
        typeof draft.updatedAt !== "string" ||
        !["standard", "express", "founders"].includes(draft.serviceLevel) ||
        !Array.isArray(draft.cards) ||
        draft.cards.length > 10
      )
        return initialDraftWorkspace;
      for (const card of draft.cards) {
        if (
          !card ||
          ![
            "localCardId",
            "player",
            "sport",
            "year",
            "set",
            "cardNumber",
            "language",
            "parallel",
          ].every((key) => typeof card[key] === "string")
        )
          return initialDraftWorkspace;
      }
    }
    const workspace = value as DraftWorkspaceState;
    return {
      ...workspace,
      selectedDraftId: workspace.drafts.some(
        (d) => d.localDraftId === workspace.selectedDraftId,
      )
        ? workspace.selectedDraftId
        : (workspace.drafts[0]?.localDraftId ?? null),
    };
  } catch {
    return initialDraftWorkspace;
  }
}

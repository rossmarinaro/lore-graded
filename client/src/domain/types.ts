export type ServiceLevel = "standard" | "express" | "founders";
export interface CardDetails {
  player: string;
  sport: string;
  year: string;
  set: string;
  cardNumber: string;
  language: string;
  parallel: string;
  manufacturer?: string;
}
export interface DraftCard extends CardDetails {
  localCardId: string;
  frontPhotoUri?: string;
  backPhotoUri?: string;
}
export interface SubmissionDraft {
  localDraftId: string;
  title: string;
  cards: DraftCard[];
  serviceLevel: ServiceLevel;
  updatedAt: string;
}
export interface DraftWorkspaceState {
  drafts: SubmissionDraft[];
  selectedDraftId: string | null;
}
export type DraftAction =
  | {
      type: "setCardPhoto";
      draftId: string;
      cardId: string;
      side: "front" | "back";
      photoUri: string;
      now: string;
    }
  | { type: "createDraft"; draftId: string; now: string }
  | { type: "selectDraft"; draftId: string }
  | { type: "renameDraft"; draftId: string; title: string; now: string }
  | { type: "addCards"; draftId: string; cards: DraftCard[]; now: string }
  | { type: "removeCard"; draftId: string; cardId: string; now: string }
  | {
      type: "setServiceLevel";
      draftId: string;
      serviceLevel: ServiceLevel;
      now: string;
    }
  | { type: "deleteDraft"; draftId: string }
  | { type: "restoreWorkspace"; workspace: DraftWorkspaceState };
export interface ContentNode {
  tag: string;
  attributes: Record<string, string | null>;
  children: ContentChild[];
}
export type ContentChild = ContentNode | string;
export interface ContentPage {
  path: string;
  title: string;
  content: ContentNode;
  requiresBehaviorMigration: boolean;
  sourceScripts: string[];
}
export interface CatalogSet extends Record<string, unknown> {
  sport: string;
  set: string;
  year: string;
  manufacturer: string;
  count: number;
  parts: string[];
}

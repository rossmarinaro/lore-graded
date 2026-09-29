import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { draftStorage } from "../platform/storage";
import {
  draftWorkspaceReducer,
  initialDraftWorkspace,
  parseDraftWorkspace,
} from "../domain/drafts";
import type {
  DraftAction,
  DraftWorkspaceState,
  SubmissionDraft,
} from "../domain/types";
interface SubmissionDraftContextValue {
  draftWorkspace: DraftWorkspaceState;
  selectedDraft: SubmissionDraft | null;
  isDraftStorageReady: boolean;
  draftStorageError: string | null;
  dispatchDraftAction: (action: DraftAction) => void;
}
const SubmissionDraftContext = createContext<
  SubmissionDraftContextValue | undefined
>(undefined);
export function SubmissionDraftProvider({ children }: PropsWithChildren) {
  const [draftWorkspace, setDraftWorkspace] = useState(initialDraftWorkspace);
  const workspaceReference = useRef(draftWorkspace);
  const pendingWrites = useRef(Promise.resolve());
  const [isDraftStorageReady, setReady] = useState(false);
  const [draftStorageError, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    draftStorage
      .read()
      .then((serialized) => {
        if (active) {
          workspaceReference.current = parseDraftWorkspace(serialized);
          setDraftWorkspace(workspaceReference.current);
        }
      })
      .catch(() => {
        if (active) setError("Local draft storage is unavailable.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  function dispatchDraftAction(action: DraftAction) {
    if (!isDraftStorageReady) return;
    try {
      const next = draftWorkspaceReducer(workspaceReference.current, action);
      workspaceReference.current = next;
      setDraftWorkspace(next);
      setError(null);
      pendingWrites.current = pendingWrites.current
        .then(() => draftStorage.write(JSON.stringify(next)))
        .catch(() =>
          setError("Draft changes could not be saved on this device."),
        );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Draft could not be updated.",
      );
    }
  }
  return (
    <SubmissionDraftContext.Provider
      value={{
        draftWorkspace,
        selectedDraft:
          draftWorkspace.drafts.find(
            (d) => d.localDraftId === draftWorkspace.selectedDraftId,
          ) ?? null,
        isDraftStorageReady,
        draftStorageError,
        dispatchDraftAction,
      }}
    >
      {children}
    </SubmissionDraftContext.Provider>
  );
}
export function useSubmissionDrafts() {
  const context = useContext(SubmissionDraftContext);
  if (!context)
    throw Error(
      "useSubmissionDrafts must be used within SubmissionDraftProvider.",
    );
  return context;
}

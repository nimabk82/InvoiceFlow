"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  autosaveReducer,
  initialSaveState,
  type SaveState,
} from "@invoiceflow/domain";

import { supabase } from "@/lib/supabase";

export type AutosaveResult<T> = {
  state: SaveState;
  draftId: string | null;
  bump: () => void;
  saveNow: () => Promise<T | null>;
  retry: () => void;
};

export function useAutosave<T>({
  create,
  update,
  debounceMs = 900,
}: {
  create: (token: string) => Promise<T & { id: string }>;
  update: (draftId: string, token: string) => Promise<T>;
  debounceMs?: number;
}): AutosaveResult<T> {
  const [saveState, dispatch] = useReducer(
    autosaveReducer,
    undefined,
    initialSaveState,
  );
  const [draftId, setDraftId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const createRef = useRef(create);
  const updateRef = useRef(update);
  const draftIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    createRef.current = create;
    updateRef.current = update;
  }, [create, update]);

  async function runSave(): Promise<T | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      dispatch({ type: "SAVE_FAILED", retryable: true });
      return null;
    }

    inFlightRef.current = true;
    dispatch({ type: "SAVE_REQUESTED" });
    try {
      const id = draftIdRef.current;
      let result: T;
      if (!id) {
        const created = await createRef.current(token);
        draftIdRef.current = created.id;
        setDraftId(created.id);
        result = created;
      } else {
        result = await updateRef.current(id, token);
      }
      dispatch({ type: "SAVE_SUCCEEDED", savedAt: new Date().toISOString() });
      return result;
    } catch {
      dispatch({ type: "SAVE_FAILED", retryable: true });
      return null;
    } finally {
      inFlightRef.current = false;
    }
  }

  const saveNow = useCallback(async (): Promise<T | null> => {
    if (inFlightRef.current) {
      return new Promise((resolve) => {
        const wait = setInterval(() => {
          if (!inFlightRef.current) {
            clearInterval(wait);
            void runSave().then(resolve);
          }
        }, 60);
      });
    }
    return runSave();
    // runSave is intentionally captured from the first render via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (revision === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void runSave();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // runSave is intentionally captured via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, debounceMs]);

  const bump = useCallback(() => {
    setRevision((value) => value + 1);
    if (saveState.state === "error") {
      dispatch({ type: "SAVE_REQUESTED" });
    }
  }, [saveState.state]);

  const retry = useCallback(() => {
    void saveNow();
  }, [saveNow]);

  return {
    state: saveState,
    draftId,
    bump,
    saveNow,
    retry,
  };
}
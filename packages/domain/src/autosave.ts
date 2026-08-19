export type SaveState =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; savedAt: string }
  | { state: 'error'; retryable: boolean };

export type AutosaveAction =
  | { type: 'SAVE_REQUESTED' }
  | { type: 'SAVE_SUCCEEDED'; savedAt: string }
  | { type: 'SAVE_FAILED'; retryable: boolean }
  | { type: 'RESET' };

export function initialSaveState(): SaveState {
  return { state: 'idle' };
}

export function autosaveReducer(
  state: SaveState,
  action: AutosaveAction,
): SaveState {
  switch (action.type) {
    case 'SAVE_REQUESTED':
      return { state: 'saving' };
    case 'SAVE_SUCCEEDED':
      return { state: 'saved', savedAt: action.savedAt };
    case 'SAVE_FAILED':
      return { state: 'error', retryable: action.retryable };
    case 'RESET':
      return { state: 'idle' };
  }
}

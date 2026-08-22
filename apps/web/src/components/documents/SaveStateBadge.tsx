"use client";

import type { SaveState } from "@invoiceflow/domain";

import { Button } from "@/components/ui";

export function SaveStateBadge({
  state,
  onRetry,
}: {
  state: SaveState;
  onRetry?: () => void;
}) {
  switch (state.state) {
    case "idle":
      return null;
    case "saving":
      return <span className="if-saved">Saving…</span>;
    case "saved":
      return <span className="if-saved">Saved ✓</span>;
    case "error":
      return (
        <span className="if-save-error">
          Not saved ⚠
          {state.retryable && onRetry ? (
            <Button variant="text" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </span>
      );
  }
}
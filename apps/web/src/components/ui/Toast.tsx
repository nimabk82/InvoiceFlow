"use client";

import Alert, { type AlertColor } from "@mui/material/Alert";
import Snackbar, { type SnackbarProps } from "@mui/material/Snackbar";

export type ToastProps = Omit<SnackbarProps, "children" | "message" | "onClose"> & {
  message: string;
  onClose: () => void;
  severity?: AlertColor;
};

export function Toast({
  autoHideDuration = 5000,
  message,
  onClose,
  severity = "info",
  ...props
}: ToastProps) {
  return (
    <Snackbar autoHideDuration={autoHideDuration} onClose={onClose} {...props}>
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}

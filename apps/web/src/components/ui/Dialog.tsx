"use client";

import MuiDialog, {
  type DialogProps as MuiDialogProps,
} from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useId, type ReactNode } from "react";

export type DialogProps = Omit<MuiDialogProps, "children" | "onClose" | "title"> & {
  actions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  title: ReactNode;
};

export function Dialog({
  actions,
  children,
  fullWidth = true,
  maxWidth = "sm",
  onClose,
  title,
  ...props
}: DialogProps) {
  const titleId = useId();

  return (
    <MuiDialog
      aria-labelledby={titleId}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      onClose={onClose}
      {...props}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </MuiDialog>
  );
}

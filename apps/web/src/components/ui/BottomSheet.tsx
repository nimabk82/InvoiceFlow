"use client";

import Box from "@mui/material/Box";
import MuiDrawer, {
  type DrawerProps as MuiDrawerProps,
} from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

export type BottomSheetProps = Omit<
  MuiDrawerProps,
  "anchor" | "children" | "onClose" | "title"
> & {
  actions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  title: ReactNode;
};

export function BottomSheet({
  actions,
  children,
  onClose,
  title,
  ...props
}: BottomSheetProps) {
  const titleId = useId();

  return (
    <MuiDrawer anchor="bottom" onClose={onClose} {...props}>
      <Box
        aria-labelledby={titleId}
        role="dialog"
        sx={{ mx: "auto", p: 3, width: "min(100%, 720px)" }}
      >
        <Typography component="h2" id={titleId} variant="h2">
          {title}
        </Typography>
        <Box sx={{ mt: 3 }}>{children}</Box>
        {actions ? (
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
            {actions}
          </Box>
        ) : null}
      </Box>
    </MuiDrawer>
  );
}

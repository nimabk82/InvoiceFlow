"use client";

import Box from "@mui/material/Box";
import MuiDrawer, {
  type DrawerProps as MuiDrawerProps,
} from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

export type DrawerProps = Omit<MuiDrawerProps, "children" | "onClose" | "title"> & {
  children: ReactNode;
  onClose: () => void;
  title: ReactNode;
};

export function Drawer({
  anchor = "right",
  children,
  onClose,
  title,
  ...props
}: DrawerProps) {
  const titleId = useId();

  return (
    <MuiDrawer anchor={anchor} onClose={onClose} {...props}>
      <Box
        aria-labelledby={titleId}
        role="dialog"
        sx={{
          maxWidth: "100vw",
          p: 3,
          width: 360,
        }}
      >
        <Typography component="h2" id={titleId} variant="h2">
          {title}
        </Typography>
        <Box sx={{ mt: 3 }}>{children}</Box>
      </Box>
    </MuiDrawer>
  );
}

"use client";

import MuiButton, {
  type ButtonProps as MuiButtonProps,
} from "@mui/material/Button";

export type ButtonProps = MuiButtonProps;

export function Button({
  children,
  color = "primary",
  variant = "contained",
  ...props
}: ButtonProps) {
  return (
    <MuiButton color={color} variant={variant} {...props}>
      {children}
    </MuiButton>
  );
}

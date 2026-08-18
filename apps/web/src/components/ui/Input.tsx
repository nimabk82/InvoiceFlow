"use client";

import MuiTextField, {
  type TextFieldProps as MuiTextFieldProps,
} from "@mui/material/TextField";

export type InputProps = MuiTextFieldProps;

export function Input({
  fullWidth = true,
  variant = "outlined",
  ...props
}: InputProps) {
  return <MuiTextField fullWidth={fullWidth} variant={variant} {...props} />;
}

export const TextField = Input;
export type TextFieldProps = InputProps;

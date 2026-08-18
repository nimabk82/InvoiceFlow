"use client";

import MenuItem from "@mui/material/MenuItem";
import TextField, {
  type TextFieldProps,
} from "@mui/material/TextField";

export type SelectValue = string | number;

export type SelectOption = Readonly<{
  disabled?: boolean;
  label: string;
  value: SelectValue;
}>;

export type SelectProps = Omit<
  TextFieldProps,
  "children" | "defaultValue" | "onChange" | "select" | "value"
> & {
  defaultValue?: SelectValue;
  label: string;
  onValueChange?: (value: string) => void;
  options: readonly SelectOption[];
  value?: SelectValue;
};

export function Select({
  defaultValue,
  fullWidth = true,
  onValueChange,
  options,
  value,
  variant = "outlined",
  ...props
}: SelectProps) {
  return (
    <TextField
      defaultValue={defaultValue}
      fullWidth={fullWidth}
      onChange={(event) => onValueChange?.(event.target.value)}
      select
      value={value}
      variant={variant}
      {...props}
    >
      {options.map((option) => (
        <MenuItem
          disabled={option.disabled}
          key={String(option.value)}
          value={option.value}
        >
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

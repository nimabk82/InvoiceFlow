"use client";

import Chip from "@mui/material/Chip";

export type StatusTone = "danger" | "info" | "neutral" | "success" | "warning";

export type StatusBadgeProps = Readonly<{
  children: string;
  className?: string;
  size?: "medium" | "small";
  testId?: string;
  tone?: StatusTone;
}>;

export function StatusBadge({
  children,
  className,
  size = "small",
  testId,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <Chip
      label={children}
      size={size}
      className={className}
      data-testid={testId}
      sx={(theme) => {
        const tones = {
          danger: {
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.main,
          },
          info: {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.dark,
          },
          neutral: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.secondary,
          },
          success: {
            backgroundColor: theme.palette.success.light,
            color: theme.palette.success.main,
          },
          warning: {
            backgroundColor: theme.palette.warning.light,
            color: theme.palette.warning.main,
          },
        } satisfies Record<StatusTone, object>;

        return tones[tone];
      }}
    />
  );
}

export const Badge = StatusBadge;
export type BadgeProps = StatusBadgeProps;

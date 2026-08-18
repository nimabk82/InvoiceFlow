import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { invoiceFlowDesignTokens } from '../../theme';

export type StatusTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning';

export type StatusBadgeProps = Readonly<{
  children: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  tone?: StatusTone;
}>;

const toneStyles = {
  danger: {
    backgroundColor: invoiceFlowDesignTokens.color.dangerSoft,
    color: invoiceFlowDesignTokens.color.danger,
  },
  info: {
    backgroundColor: invoiceFlowDesignTokens.color.primarySoft,
    color: invoiceFlowDesignTokens.color.primaryHover,
  },
  neutral: {
    backgroundColor: invoiceFlowDesignTokens.color.background,
    color: invoiceFlowDesignTokens.color.textSecondary,
  },
  success: {
    backgroundColor: invoiceFlowDesignTokens.color.successSoft,
    color: invoiceFlowDesignTokens.color.success,
  },
  warning: {
    backgroundColor: invoiceFlowDesignTokens.color.warningSoft,
    color: invoiceFlowDesignTokens.color.warning,
  },
} as const satisfies Record<StatusTone, { backgroundColor: string; color: string }>;

export function StatusBadge({
  children,
  style,
  testID,
  tone = 'neutral',
}: StatusBadgeProps) {
  const toneStyle = toneStyles[tone];

  return (
    <Surface
      elevation={0}
      style={[styles.badge, { backgroundColor: toneStyle.backgroundColor }, style]}
      testID={testID}
    >
      <Text style={[styles.label, { color: toneStyle.color }]} variant="labelSmall">
        {children}
      </Text>
    </Surface>
  );
}

export const Badge = StatusBadge;
export type BadgeProps = StatusBadgeProps;

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: invoiceFlowDesignTokens.radius.small,
    paddingHorizontal: invoiceFlowDesignTokens.spacing[2],
    paddingVertical: invoiceFlowDesignTokens.spacing[0],
  },
  label: {
    fontWeight: '600',
  },
});

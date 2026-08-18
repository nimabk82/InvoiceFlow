import { StyleSheet } from 'react-native';
import {
  Button as PaperButton,
  type ButtonProps as PaperButtonProps,
} from 'react-native-paper';

import { invoiceFlowDesignTokens } from '../../theme';

export type ButtonProps = PaperButtonProps;

export function Button({
  children,
  contentStyle,
  mode = 'contained',
  ...props
}: ButtonProps) {
  return (
    <PaperButton
      contentStyle={[styles.content, contentStyle]}
      mode={mode}
      {...props}
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: invoiceFlowDesignTokens.sizing.minimumTouchTarget,
  },
});

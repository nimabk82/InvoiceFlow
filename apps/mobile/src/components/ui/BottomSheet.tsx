import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { invoiceFlowDesignTokens } from '../../theme';

export type BottomSheetProps = Readonly<{
  actions?: ReactNode;
  children: ReactNode;
  onDismiss: () => void;
  testID?: string;
  title: ReactNode;
  visible: boolean;
}>;

export function BottomSheet({
  actions,
  children,
  onDismiss,
  testID,
  title,
  visible,
}: BottomSheetProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onDismiss}
      transparent
      visible={visible}
    >
      <View style={styles.container}>
        <Pressable
          accessibilityLabel="Close bottom sheet"
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.backdrop}
        />
        <Surface
          accessibilityViewIsModal
          elevation={3}
          style={styles.sheet}
          testID={testID}
        >
          <View style={styles.handle} />
          <Text variant="titleLarge">{title}</Text>
          <View style={styles.content}>{children}</View>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: invoiceFlowDesignTokens.spacing[2],
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(16, 24, 40, 0.4)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    marginVertical: invoiceFlowDesignTokens.spacing[3],
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: invoiceFlowDesignTokens.color.borderStrong,
    borderRadius: invoiceFlowDesignTokens.radius.small,
    height: 4,
    marginBottom: invoiceFlowDesignTokens.spacing[3],
    width: 40,
  },
  sheet: {
    backgroundColor: invoiceFlowDesignTokens.color.surface,
    borderTopLeftRadius: invoiceFlowDesignTokens.radius.modal,
    borderTopRightRadius: invoiceFlowDesignTokens.radius.modal,
    maxHeight: '90%',
    padding: invoiceFlowDesignTokens.spacing[4],
  },
});

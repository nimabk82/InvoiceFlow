import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { invoiceFlowDesignTokens } from '../../theme';

export type DrawerProps = Readonly<{
  children: ReactNode;
  onDismiss: () => void;
  testID?: string;
  title: ReactNode;
  visible: boolean;
}>;

export function Drawer({
  children,
  onDismiss,
  testID,
  title,
  visible,
}: DrawerProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onDismiss}
      transparent
      visible={visible}
    >
      <View style={styles.container}>
        <Surface
          accessibilityViewIsModal
          elevation={3}
          style={styles.drawer}
          testID={testID}
        >
          <Text variant="titleLarge">{title}</Text>
          <View style={styles.content}>{children}</View>
        </Surface>
        <Pressable
          accessibilityLabel="Close drawer"
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.backdrop}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(16, 24, 40, 0.4)',
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    marginTop: invoiceFlowDesignTokens.spacing[4],
  },
  drawer: {
    backgroundColor: invoiceFlowDesignTokens.color.surface,
    maxWidth: 360,
    padding: invoiceFlowDesignTokens.spacing[4],
    paddingTop: invoiceFlowDesignTokens.spacing[6],
    width: '88%',
  },
});

import type { ReactNode } from 'react';
import { Dialog as PaperDialog, Portal } from 'react-native-paper';

export type DialogProps = Readonly<{
  actions?: ReactNode;
  children: ReactNode;
  dismissable?: boolean;
  onDismiss: () => void;
  testID?: string;
  title: ReactNode;
  visible: boolean;
}>;

export function Dialog({
  actions,
  children,
  dismissable = true,
  onDismiss,
  testID,
  title,
  visible,
}: DialogProps) {
  return (
    <Portal>
      <PaperDialog
        dismissable={dismissable}
        onDismiss={onDismiss}
        testID={testID}
        visible={visible}
      >
        <PaperDialog.Title>{title}</PaperDialog.Title>
        <PaperDialog.Content>{children}</PaperDialog.Content>
        {actions ? <PaperDialog.Actions>{actions}</PaperDialog.Actions> : null}
      </PaperDialog>
    </Portal>
  );
}

import {
  Portal,
  Snackbar,
  type SnackbarProps as PaperSnackbarProps,
} from 'react-native-paper';

export type ToastProps = Omit<PaperSnackbarProps, 'children' | 'onDismiss'> & {
  message: string;
  onDismiss: () => void;
};

export function Toast({
  duration = 5000,
  message,
  onDismiss,
  ...props
}: ToastProps) {
  return (
    <Portal>
      <Snackbar duration={duration} onDismiss={onDismiss} {...props}>
        {message}
      </Snackbar>
    </Portal>
  );
}

import {
  TextInput as PaperTextInput,
  type TextInputProps as PaperTextInputProps,
} from 'react-native-paper';

export type InputProps = PaperTextInputProps;

export function Input({ mode = 'outlined', ...props }: InputProps) {
  return <PaperTextInput mode={mode} {...props} />;
}

export const TextInput = Input;
export type TextInputProps = InputProps;

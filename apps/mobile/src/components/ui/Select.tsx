import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Button as PaperButton,
  HelperText,
  RadioButton,
  TextInput as PaperTextInput,
} from 'react-native-paper';

import { Dialog } from './Dialog';
import { Input } from './Input';

export type SelectOption = Readonly<{
  disabled?: boolean;
  label: string;
  value: string;
}>;

export type SelectProps = Readonly<{
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  testID?: string;
  value?: string;
}>;

export function Select({
  disabled = false,
  error = false,
  helperText,
  label,
  onValueChange,
  options,
  placeholder = 'Select an option',
  testID,
  value,
}: SelectProps) {
  const [visible, setVisible] = useState(false);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const close = () => setVisible(false);

  return (
    <>
      <Pressable
        accessibilityLabel={`${label}, ${selectedOption?.label ?? placeholder}`}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: visible }}
        disabled={disabled}
        onPress={() => setVisible(true)}
        testID={testID}
      >
        <View pointerEvents="none">
          <Input
            disabled={disabled}
            error={error}
            label={label}
            placeholder={placeholder}
            right={<PaperTextInput.Icon icon="menu-down" />}
            value={selectedOption?.label ?? ''}
          />
        </View>
      </Pressable>
      {helperText ? (
        <HelperText type={error ? 'error' : 'info'}>{helperText}</HelperText>
      ) : null}
      <Dialog
        actions={<PaperButton onPress={close}>Cancel</PaperButton>}
        onDismiss={close}
        title={label}
        visible={visible}
      >
        <RadioButton.Group
          onValueChange={(nextValue) => {
            onValueChange(nextValue);
            close();
          }}
          value={value ?? ''}
        >
          <View style={styles.options}>
            {options.map((option) => (
              <RadioButton.Item
                disabled={option.disabled}
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </View>
        </RadioButton.Group>
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  options: {
    marginHorizontal: -16,
  },
});

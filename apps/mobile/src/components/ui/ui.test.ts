import {
  Badge,
  BottomSheet,
  Button,
  Dialog,
  Drawer,
  Input,
  Select,
  StatusBadge,
  TextInput,
  Toast,
} from './index';

describe('Mobile UI primitives', () => {
  it('exports the app-owned Paper component boundary', () => {
    expect(
      [
        Button,
        Input,
        Select,
        StatusBadge,
        Dialog,
        Drawer,
        BottomSheet,
        Toast,
      ].every((component) => typeof component === 'function'),
    ).toBe(true);
    expect(Badge).toBe(StatusBadge);
    expect(TextInput).toBe(Input);
  });
});

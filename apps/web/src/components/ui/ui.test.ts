import { describe, expect, it } from "vitest";

import {
  Badge,
  BottomSheet,
  Button,
  Dialog,
  Drawer,
  Input,
  Select,
  StatusBadge,
  TextField,
  Toast,
} from "./index";

describe("Web UI primitives", () => {
  it("exports the app-owned MUI component boundary", () => {
    expect(
      [Button, Input, Select, StatusBadge, Dialog, Drawer, BottomSheet, Toast].every(
        (component) => typeof component === "function",
      ),
    ).toBe(true);
    expect(Badge).toBe(StatusBadge);
    expect(TextField).toBe(Input);
  });
});

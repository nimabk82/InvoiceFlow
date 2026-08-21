"use client";

import { useEffect, useState } from "react";

export function Toast({ message }: { message: string | null }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message || !visible) return null;

  return <div className="if-toast">{message}</div>;
}

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  return { toast, setToast };
}

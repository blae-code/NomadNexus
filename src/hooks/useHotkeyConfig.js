import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nomad.hotkeys";

const readStorage = () => {
  if (typeof window === "undefined") return { bindings: {} };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bindings: {} };
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { bindings: {} };
  } catch (error) {
    console.error("Failed to read hotkey storage", error);
    return { bindings: {} };
  }
};

const writeStorage = (payload) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to persist hotkey storage", error);
  }
};

const normalize = (combo) => combo?.trim().toLowerCase() ?? "";

const parseCombo = (combo) => {
  const normalized = normalize(combo);
  if (!normalized) return null;

  const pieces = normalized.split("+");
  const key = pieces.pop();
  const modifiers = pieces.reduce(
    (acc, part) => {
      const trimmed = part.trim();
      if (trimmed === "cmd" || trimmed === "meta" || trimmed === "command") acc.metaKey = true;
      if (trimmed === "ctrl" || trimmed === "control") acc.ctrlKey = true;
      if (trimmed === "shift") acc.shiftKey = true;
      if (trimmed === "alt" || trimmed === "option") acc.altKey = true;
      return acc;
    },
    { ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }
  );

  return { key, ...modifiers };
};

const matchesEvent = (event, combo) => {
  const parsed = parseCombo(combo);
  if (!parsed || !parsed.key) return false;

  return (
    event.key?.toLowerCase() === parsed.key &&
    (!!event.metaKey === !!parsed.metaKey) &&
    (!!event.ctrlKey === !!parsed.ctrlKey) &&
    (!!event.shiftKey === !!parsed.shiftKey) &&
    (!!event.altKey === !!parsed.altKey)
  );
};

export function useHotkeyConfig(bindingId, { defaultCombo = "", defaultEnabled = false } = {}) {
  const [store, setStore] = useState(() => readStorage());

  useEffect(() => {
    writeStorage(store);
  }, [store]);

  const entry = useMemo(() => store.bindings?.[bindingId] || {}, [bindingId, store.bindings]);

  const combo = entry.combo ?? defaultCombo;
  const enabled = entry.enabled ?? defaultEnabled;

  const setCombo = (nextCombo) => {
    setStore((prev) => ({
      ...prev,
      bindings: {
        ...prev.bindings,
        [bindingId]: {
          ...prev.bindings?.[bindingId],
          combo: normalize(nextCombo),
        },
      },
    }));
  };

  const setEnabled = (nextEnabled) => {
    setStore((prev) => ({
      ...prev,
      bindings: {
        ...prev.bindings,
        [bindingId]: {
          combo: normalize(prev.bindings?.[bindingId]?.combo ?? combo),
          enabled: nextEnabled,
        },
      },
    }));
  };

  const checkEvent = (event) => matchesEvent(event, combo);

  return { combo, enabled, setCombo, setEnabled, matchesEvent: checkEvent };
}

export const hotkeyHelpers = { matchesEvent };

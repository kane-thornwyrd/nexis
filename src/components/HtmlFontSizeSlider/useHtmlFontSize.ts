import { useEffect, useState } from "react";

export const FONT_SIZE_OPTIONS = [
  {
    iconSize: 7,
    label: "Compact",
    value: "0.8em",
  },
  {
    iconSize: 17,
    label: "Comfortable",
    value: "1em",
  },
  {
    iconSize: 25,
    label: "Default",
    value: "1.5em",
  },
] as const;

type FontSizeValue = (typeof FONT_SIZE_OPTIONS)[number]["value"];
type FontSizeStorageAction = "read" | "write";
type FontSizeStorage = Pick<Storage, "getItem" | "setItem">;
type FontSizeStyleTarget = Pick<
  CSSStyleDeclaration,
  "fontSize" | "removeProperty"
>;

const DEFAULT_FONT_SIZE: FontSizeValue = "1em";
const FONT_SIZE_STORAGE_KEY = "nexis:html-font-size";
const FONT_SIZE_VALUES = new Set<FontSizeValue>(
  FONT_SIZE_OPTIONS.map(({ value }) => value),
);

const hasWarnedFontSizeStorageAction: Record<FontSizeStorageAction, boolean> = {
  read: false,
  write: false,
};

export const isFontSizeValue = (value: string): value is FontSizeValue =>
  FONT_SIZE_VALUES.has(value as FontSizeValue);

const warnFontSizeStorageIssue = (
  action: FontSizeStorageAction,
  error: unknown,
) => {
  if (hasWarnedFontSizeStorageAction[action]) {
    return;
  }

  hasWarnedFontSizeStorageAction[action] = true;

  console.warn(`Unable to ${action} the HTML font size preference.`, error);
};

const getFontSizeStorage = (): FontSizeStorage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const readStoredFontSize = (
  storage: Pick<Storage, "getItem"> | null = getFontSizeStorage(),
): FontSizeValue => {
  if (!storage) {
    return DEFAULT_FONT_SIZE;
  }

  try {
    const storedFontSize = storage.getItem(FONT_SIZE_STORAGE_KEY);

    if (storedFontSize && isFontSizeValue(storedFontSize)) {
      return storedFontSize;
    }
  } catch (error) {
    warnFontSizeStorageIssue("read", error);
    return DEFAULT_FONT_SIZE;
  }

  return DEFAULT_FONT_SIZE;
};

export const persistFontSize = (
  fontSize: FontSizeValue,
  storage: Pick<Storage, "setItem"> | null = getFontSizeStorage(),
) => {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
  } catch (error) {
    warnFontSizeStorageIssue("write", error);
  }
};

export const captureInlineFontSize = (style: FontSizeStyleTarget): string =>
  style.fontSize;

export const applyInlineFontSize = (
  style: FontSizeStyleTarget,
  fontSize: FontSizeValue,
) => {
  style.fontSize = fontSize;
};

export const restoreInlineFontSize = (
  style: FontSizeStyleTarget,
  previousFontSize: string,
) => {
  if (previousFontSize) {
    style.fontSize = previousFontSize;
    return;
  }

  style.removeProperty("font-size");
};

export const useHtmlFontSize = () => {
  const [fontSize, setFontSize] = useState(readStoredFontSize);

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    const previousFontSize = captureInlineFontSize(rootStyle);

    return () => {
      restoreInlineFontSize(rootStyle, previousFontSize);
    };
  }, []);

  useEffect(() => {
    applyInlineFontSize(document.documentElement.style, fontSize);
    persistFontSize(fontSize);
  }, [fontSize]);

  return { fontSize, setFontSize };
};

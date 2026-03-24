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

const readStoredFontSize = (): FontSizeValue => {
  if (typeof window === "undefined") {
    return DEFAULT_FONT_SIZE;
  }

  try {
    const storedFontSize = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);

    if (storedFontSize && isFontSizeValue(storedFontSize)) {
      return storedFontSize;
    }
  } catch (error) {
    warnFontSizeStorageIssue("read", error);
    return DEFAULT_FONT_SIZE;
  }

  return DEFAULT_FONT_SIZE;
};

const persistFontSize = (fontSize: FontSizeValue) => {
  try {
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
  } catch (error) {
    warnFontSizeStorageIssue("write", error);
  }
};

export const useHtmlFontSize = () => {
  const [fontSize, setFontSize] = useState(readStoredFontSize);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize;
    persistFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    const previousFontSize = root.style.fontSize;

    return () => {
      if (previousFontSize) {
        root.style.fontSize = previousFontSize;
        return;
      }

      root.style.removeProperty("font-size");
    };
  }, []);

  return { fontSize, setFontSize };
};

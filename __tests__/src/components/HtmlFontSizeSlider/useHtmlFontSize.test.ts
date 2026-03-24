import { expect, test } from "bun:test";

import {
  applyInlineFontSize,
  captureInlineFontSize,
  isFontSizeValue,
  persistFontSize,
  readStoredFontSize,
  restoreInlineFontSize,
} from "@/components/HtmlFontSizeSlider/useHtmlFontSize";

const FONT_SIZE_STORAGE_KEY = "nexis:html-font-size";

const withSilencedConsoleWarn = (run: () => void) => {
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    run();
  } finally {
    console.warn = originalWarn;
  }
};

const createMockStorage = (initialEntries: Record<string, string> = {}) => {
  const entries = new Map(Object.entries(initialEntries));

  return {
    entries,
    storage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
    },
  };
};

const createThrowingReadStorage = () => ({
  getItem: (_key: string) => {
    throw new Error("read failed");
  },
});

const createThrowingWriteStorage = () => ({
  setItem: (_key: string, _value: string) => {
    throw new Error("write failed");
  },
});

const createMockStyle = (initialFontSize = "") => {
  const removedProperties: string[] = [];
  let style: Pick<CSSStyleDeclaration, "fontSize" | "removeProperty">;

  style = {
    fontSize: initialFontSize,
    removeProperty: (propertyName: string) => {
      removedProperties.push(propertyName);

      if (propertyName === "font-size") {
        style.fontSize = "";
      }

      return "";
    },
  };

  return { removedProperties, style };
};

test("isFontSizeValue only accepts configured font sizes", () => {
  expect(isFontSizeValue("0.8em")).toBe(true);
  expect(isFontSizeValue("1em")).toBe(true);
  expect(isFontSizeValue("1.5em")).toBe(true);
  expect(isFontSizeValue("2em")).toBe(false);
  expect(isFontSizeValue("")).toBe(false);
});

test("readStoredFontSize returns valid stored values and falls back otherwise", () => {
  const validStorage = createMockStorage({
    [FONT_SIZE_STORAGE_KEY]: "1.5em",
  });
  const invalidStorage = createMockStorage({
    [FONT_SIZE_STORAGE_KEY]: "2em",
  });

  expect(readStoredFontSize(validStorage.storage)).toBe("1.5em");
  expect(readStoredFontSize(invalidStorage.storage)).toBe("1em");
  expect(readStoredFontSize(null)).toBe("1em");
});

test("readStoredFontSize falls back when storage reads fail", () => {
  withSilencedConsoleWarn(() => {
    expect(readStoredFontSize(createThrowingReadStorage())).toBe("1em");
  });
});

test("persistFontSize writes the selected size and tolerates storage write failures", () => {
  const { entries, storage } = createMockStorage();

  persistFontSize("0.8em", storage);
  expect(entries.get(FONT_SIZE_STORAGE_KEY)).toBe("0.8em");

  withSilencedConsoleWarn(() => {
    expect(() =>
      persistFontSize("1em", createThrowingWriteStorage()),
    ).not.toThrow();
  });
});

test("restores the prior inline root font size after applying a new one", () => {
  const { removedProperties, style } = createMockStyle("125%");
  const previousFontSize = captureInlineFontSize(style);

  applyInlineFontSize(style, "1.5em");
  expect(style.fontSize).toBe("1.5em");

  restoreInlineFontSize(style, previousFontSize);
  expect(style.fontSize).toBe("125%");
  expect(removedProperties).toEqual([]);
});

test("removes the inline font-size when there was no prior root override", () => {
  const { removedProperties, style } = createMockStyle();
  const previousFontSize = captureInlineFontSize(style);

  applyInlineFontSize(style, "0.8em");
  expect(style.fontSize).toBe("0.8em");

  restoreInlineFontSize(style, previousFontSize);
  expect(style.fontSize).toBe("");
  expect(removedProperties).toEqual(["font-size"]);
});

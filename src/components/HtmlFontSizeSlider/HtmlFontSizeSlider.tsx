import { IconLetterCase } from "@tabler/icons-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FONT_SIZE_OPTIONS,
  isFontSizeValue,
  useHtmlFontSize,
} from "./useHtmlFontSize";

export function HtmlFontSizeSlider() {
  const { fontSize, setFontSize } = useHtmlFontSize();

  return (
    <aside className="control-panel" aria-label="HTML font size controls">
      <div className="control-panel__header">
        <span>Font size</span>
        <output className="control-panel__value">{fontSize}</output>
      </div>

      <ToggleGroup
        type="single"
        value={fontSize}
        variant="outline"
        size="sm"
        spacing={1}
        className="html-font-size-slider__group"
        aria-label="HTML font size"
        onValueChange={(nextValue) => {
          if (isFontSizeValue(nextValue)) {
            setFontSize(nextValue);
          }
        }}
      >
        {FONT_SIZE_OPTIONS.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="html-font-size-slider__item"
            aria-label={`${option.label} font size (${option.value})`}
            title={`${option.label} (${option.value})`}
          >
            <IconLetterCase size={option.iconSize} stroke={2} />
            <span className="sr-only">{option.value}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </aside>
  );
}

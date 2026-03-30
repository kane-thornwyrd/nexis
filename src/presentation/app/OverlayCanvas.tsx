import { type CSSProperties } from "react";

import { cn } from "@/lib/utils";
import { type OverlayRecord } from "@/app-state";

type OverlayCanvasProps = {
  overlay: OverlayRecord;
  mode?: "preview" | "staging" | "render";
  className?: string;
};

const getModeClassName = (mode: OverlayCanvasProps["mode"]) => {
  switch (mode) {
    case "staging":
      return "ring-2 ring-amber-300/70";
    case "render":
      return "ring-1 ring-white/10";
    default:
      return "ring-1 ring-border";
  }
};

export function OverlayCanvas({
  overlay,
  mode = "preview",
  className,
}: OverlayCanvasProps) {
  const canvasStyle: CSSProperties = {
    aspectRatio: `${overlay.width} / ${overlay.height}`,
    background: overlay.background,
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-black shadow-2xl",
        getModeClassName(mode),
        className,
      )}
      style={canvasStyle}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_55%)]" />

      {overlay.widgets.map((widget) => {
        const widgetStyle: CSSProperties = {
          left: `${widget.x}%`,
          top: `${widget.y}%`,
          width: `${widget.width}%`,
        };

        return (
          <section
            key={widget.id}
            className="absolute overflow-hidden rounded-lg border border-white/12 bg-black/50 px-3 py-2 text-white shadow-lg backdrop-blur-md"
            style={widgetStyle}
          >
            <div
              className="mb-2 h-1.5 rounded-full"
              style={{ backgroundColor: widget.accent }}
            />

            <p className="text-[0.62rem] uppercase tracking-[0.25em] text-white/55">
              {widget.kind}
            </p>

            <h3 className="mt-1 font-heading text-sm font-semibold tracking-tight">
              {widget.title}
            </h3>

            <p className="text-[0.72rem] leading-5 text-white/72">
              {widget.subtitle}
            </p>

            <div className="mt-3 space-y-1 text-[0.72rem] leading-5 text-white/88">
              {widget.values.map((value) => (
                <p key={value}>{value}</p>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
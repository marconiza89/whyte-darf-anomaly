"use client";
import React from "react";

type Props = {
  /** margine del vertice alto dal top (px, %, ecc.) */
  topOffset?: string;      // es. "40px" | "5%"
  /** margine del vertice basso-sinistra dal bordo sinistro */
  leftMargin?: string;     // es. "24px"
  /** margine del vertice basso-destra dal bordo destro */
  rightMargin?: string;    // es. "24px"
  /** altezza del triangolo (qualsiasi unità responsive) */
  height?: string;         // es. "40vh" | "320px" | "min(40vh, 420px)"
  /** colore di riempimento */
  fill?: string;           // es. "rgba(0, 200, 255, .12)"
  /** bordo (simulato con box-shadow inset, che rispetta la clip) */
  borderColor?: string;    // es. "rgba(120, 240, 255, .5)"
  borderWidth?: number;    // px
  className?: string;
};

export default function ResponsiveTriangle({
  topOffset = "48px",
  leftMargin = "24px",
  rightMargin = "24px",
  height = "40vh",
  fill = "rgba(0, 200, 255, .12)",
  borderColor = "rgba(120, 240, 255, .45)",
  borderWidth = 1,
  className,
}: Props) {
  // Custom properties per la clip
  const vars = {
    
    "--tri-top": topOffset,
    "--tri-left": leftMargin,
    "--tri-right": rightMargin,
  } as React.CSSProperties;

  return (
    <div
      className={`fixed h-[100svh] w-full ${className ?? ""}`}
      style={{ height }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          ...vars,
          // Triangolo: vertice alto centrato, inferiori ai margini
          clipPath:
            "polygon(50% var(--tri-top), var(--tri-left) 95%, calc(100% - var(--tri-right)) 95%)",
          background: fill,
          // “Bordo” rispettando la clip-path
          boxShadow: `inset 0 0 0 ${borderWidth}px ${borderColor}`,
          // Facoltativo: anti-alias
          willChange: "clip-path",
        }}
      />
    </div>
  );
}
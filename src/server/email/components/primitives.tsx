import React from "react";

export const COLORS = {
  green: "#1A322F",
  teal: "#05B4C9",
  darkBg: "#3a3a3a",
  red: "#DC2626",
  redLight: "#FEE2E2",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  greyLight: "#F3F4F6",
  text: "#111111",
  muted: "#6B7280",
  white: "#ffffff",
} as const;

export const FONT_STACK = "Arial, Helvetica, sans-serif";

/** Table cell wrapper — use for all layout cells */
export function Cell({
  children,
  style,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) {
  return (
    <td style={style} {...rest}>
      {children}
    </td>
  );
}

/** Full-width table row */
export function Row({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <tr style={style}>{children}</tr>;
}

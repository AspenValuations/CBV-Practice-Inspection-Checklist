// Extend React's HTML attribute types to allow email-specific attributes
// (bgcolor, align, valign, etc.) that Outlook requires alongside CSS style props.
/* eslint-disable @typescript-eslint/no-unused-vars */
import "react";

declare module "react" {
  interface TdHTMLAttributes<T> {
    bgcolor?: string;
    valign?: "top" | "middle" | "bottom" | "baseline";
  }
  interface TableHTMLAttributes<T> {
    bgcolor?: string;
  }
  interface ThHTMLAttributes<T> {
    bgcolor?: string;
  }
}

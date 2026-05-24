interface StatusBannerProps {
  flagCount: number;
}

export function StatusBanner({ flagCount }: StatusBannerProps) {
  if (flagCount > 0) {
    return (
      <div className="rounded-md bg-red-600 text-white px-4 py-3 text-sm font-medium">
        ⚠ {flagCount} item{flagCount === 1 ? "" : "s"} flagged — do not issue report until flagged
        items are resolved or documented.
      </div>
    );
  }
  return (
    <div className="rounded-md bg-green-600 text-white px-4 py-3 text-sm font-medium">
      ✓ All items satisfactory — safe to issue.
    </div>
  );
}

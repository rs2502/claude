import type { Ingredient } from "@/lib/content";

/** Botanical line glyphs, drawn for Zafraan — single-weight, slightly imperfect. */
const PATHS: Record<Ingredient["glyph"], string> = {
  thread: "M12 4c.6 3.2-.4 6.6-.2 9.6.2 2.5 1.4 4.6 1.2 6.4M15.5 5c-.4 3 .9 5.4.7 8.2-.2 2.4-1.6 4.3-1.4 6.2M8.6 5.6c.9 2.7.2 5.4.7 8 .4 2.2 1.8 4 1.9 5.8",
  pod: "M12 3.5c3.6 2.4 4.6 7.4 3.6 11.2-.7 2.7-2.1 4.7-3.6 5.8-1.5-1.1-2.9-3.1-3.6-5.8-1-3.8 0-8.8 3.6-11.2zM12 4.5v15.2M12 2.2v1.6",
  seed: "M8.2 17.4c-1.4-3.3.3-9.1 4.3-11.6 1.6 3.8.4 9.4-4.3 11.6zM9.2 15.6c.9-2.6 1.9-4.8 3.1-8.7M14.4 18.6c-.6-2.4.9-6.2 3.6-7.6.9 2.6-.5 6.2-3.6 7.6z",
  bark: "M6.5 7.2c3.6-.9 7.4-1 11 .1v9.6c-3.6-1.1-7.4-1-11-.1zM6.5 7.2c-1.2.7-1.6 2.6-1 3.6.8 1.2 2.6.8 2.7-.3M8.5 10.2c2.8-.5 5.6-.4 8.3.3",
  star: "M12 3.4l1.6 5.2 5.3-1.4-3.7 4 3.7 4-5.3-1.4L12 19l-1.6-5.2-5.3 1.4 3.7-4-3.7-4 5.3 1.4zM12 10.2v2.8",
  leaf: "M5.2 18.6C5.4 10.9 10.5 5.6 18.8 5.2c-.2 8-5.7 13.3-13.6 13.4zM5.2 18.6c3.6-3.8 7.2-7.6 11.6-11.2M9.4 13.8l-.4-3.2M12.6 10.6l2.6.4",
  chili: "M16.6 4.4c-.8 1.1-.8 2.3-.2 3.3M16.4 7.7c-2.4.2-4 2.2-4.7 4.8-.8 3.2-2.8 5.8-6.4 7 4.9 1.1 9.4-.8 11.3-4.6 1.2-2.4 1.4-5.2-.2-7.2z",
  root: "M7 9.4c1.8-2.2 5.6-3 8.6-1.6 2.3 1.1 2.2 3.4.3 4.2-2.6 1.1-2.2 3.8-4.6 5.1-2.2 1.2-4.6.2-5.2-1.8M9.8 12.2c1.3-.4 2.5-.3 3.6.3M15.4 7.4l1.8-2.4M7.6 15.8l-2.4 1.6",
};

export function Glyph({ kind, className }: { kind: Ingredient["glyph"]; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d={PATHS[kind]} stroke="currentColor" strokeWidth={1.05} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

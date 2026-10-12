import { cn } from "@/lib/utils";

/** Running head, like a magazine folio: number, rule, chapter name. */
export function Folio({ no, label, className }: { no: string; label: string; className?: string }) {
  return (
    <p className={cn("eyebrow flex items-center gap-3 text-ink-soft", className)}>
      <span className="folio">No. {no}</span>
      <span aria-hidden className="h-px w-10 bg-current opacity-40" />
      {label}
    </p>
  );
}

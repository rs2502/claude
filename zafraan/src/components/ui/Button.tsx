import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Arrow } from "./Arrow";
import { Magnetic } from "./Magnetic";
import { TransitionLink } from "@/components/chrome/TransitionLink";

type Variant = "solid" | "ghost" | "light";

const base =
  "group/btn relative inline-flex h-14 items-center gap-4 overflow-hidden rounded-full pl-7 pr-6 text-[0.8125rem] font-medium tracking-[0.02em] transition-[box-shadow,color] duration-500 ease-[var(--ease-editorial)] isolate";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-canvas shadow-soft hover:shadow-lift",
  ghost: "text-ink ring-1 ring-inset ring-ink/25 hover:text-canvas",
  light: "bg-canvas/95 text-ink shadow-soft hover:text-canvas",
};

const fill: Record<Variant, string> = {
  solid: "bg-saffron",
  ghost: "bg-ink",
  light: "bg-ink",
};

function Inner({ children, variant }: { children: ReactNode; variant: Variant }) {
  return (
    <>
      {/* A circle swells from below, like ink drawn up into paper. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-1/2 top-full -z-10 aspect-square w-[140%] -translate-x-1/2 rounded-full transition-transform duration-700 ease-[var(--ease-editorial)] group-hover/btn:-translate-y-[62%] group-focus-visible/btn:-translate-y-[62%]",
          fill[variant],
        )}
      />
      <span data-magnetic-label className="relative flex items-center gap-4">
        <span>{children}</span>
        <span className="relative block h-[11px] w-[22px] overflow-hidden">
          {/* Icon springs: out right, back in from the left. */}
          <Arrow className="absolute inset-0 transition-transform duration-[650ms] ease-[cubic-bezier(.34,1.56,.64,1)] group-hover/btn:translate-x-[140%]" />
          <Arrow className="absolute inset-0 -translate-x-[140%] transition-transform duration-[650ms] ease-[cubic-bezier(.34,1.56,.64,1)] delay-75 group-hover/btn:translate-x-0" />
        </span>
      </span>
    </>
  );
}

type LinkProps = { href: string; variant?: Variant; children: ReactNode; className?: string };

export function ButtonLink({ href, variant = "solid", children, className }: LinkProps) {
  const cls = cn(base, variants[variant], className);
  // External pages, phone numbers and mail open normally; internal routes get the curtain.
  const external = /^(https?:|tel:|mailto:)/.test(href);
  return (
    <Magnetic>
      {external ? (
        <a href={href} className={cls} data-cursor="link" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
          <Inner variant={variant}>{children}</Inner>
        </a>
      ) : (
        <TransitionLink href={href} className={cls} data-cursor="link">
          <Inner variant={variant}>{children}</Inner>
        </TransitionLink>
      )}
    </Magnetic>
  );
}

type BtnProps = ComponentPropsWithoutRef<"button"> & { variant?: Variant };

export function Button({ variant = "solid", children, className, ...rest }: BtnProps) {
  return (
    <Magnetic>
      <button {...rest} className={cn(base, variants[variant], "disabled:opacity-60", className)} data-cursor="link">
        <Inner variant={variant}>{children}</Inner>
      </button>
    </Magnetic>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useLenis } from "@/components/motion/SmoothScroll";
import { experience } from "@/lib/store";

type Props = ComponentPropsWithoutRef<typeof Link> & { href: string };

let pending: (() => void) | null = null;
/** Called by the curtain once it fully covers the page. */
export const consumePendingNavigation = () => {
  const go = pending;
  pending = null;
  go?.();
};

/**
 * In-page anchors glide with Lenis. Cross-page links draw the curtain first
 * and only navigate once the page is covered — no hard cuts.
 */
export function TransitionLink({ href, onClick, children, ...rest }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    const [path, hash] = href.split("#");
    const target = path || pathname;

    if (target === pathname) {
      if (!hash) return;
      e.preventDefault();
      const el = document.getElementById(hash);
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 5) });
      else el.scrollIntoView({ behavior: "auto" });
      el.focus({ preventScroll: true });
      history.replaceState(null, "", `#${hash}`);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    pending = () => router.push(href);
    experience.set({ transitioning: true });
  };

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}

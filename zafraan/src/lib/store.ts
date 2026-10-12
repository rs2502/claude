"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny external store for cross-cutting experience state (loader,
 * page transitions). Avoids a context re-render cascade on every update.
 */
type State = {
  loaded: boolean;
  transitioning: boolean;
};

let state: State = { loaded: false, transitioning: false };
const listeners = new Set<() => void>();

export const experience = {
  get: () => state,
  set(patch: Partial<State>) {
    const next = { ...state, ...patch };
    if (Object.keys(patch).every((k) => next[k as keyof State] === state[k as keyof State])) return;
    state = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useExperience<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    experience.subscribe,
    () => select(state),
    () => select({ loaded: false, transitioning: false }),
  );
}

/** Pointer, normalised to -1..1, read inside rAF loops (never triggers React). */
export const pointer = { x: 0, y: 0 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}

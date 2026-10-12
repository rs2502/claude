/** Hand-drawn arrow: a hairline shaft and an open, slightly asymmetric head. */
export function Arrow({ className = "", dir = "right" }: { className?: string; dir?: "right" | "down" | "up-right" }) {
  const rot = dir === "down" ? 90 : dir === "up-right" ? -45 : 0;
  return (
    <svg
      viewBox="0 0 24 12"
      width="22"
      height="11"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <path d="M0.5 6.1 C 8 5.9, 15 6.05, 22.6 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M17.2 1.1 C 19.4 3.3, 20.9 4.8, 22.8 6 C 20.8 7.3, 19.3 8.7, 17.4 10.9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

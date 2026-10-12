"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useId, useState } from "react";
import { reserve, type ReserveState } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TIMES = ["18:30", "19:15", "20:00", "20:45"];
const EASE = [0.22, 1, 0.36, 1] as const;

function Field({
  label,
  name,
  type = "text",
  error,
  autoComplete,
  min,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  autoComplete?: string;
  min?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("group relative", className)}>
      <input
        id={id}
        name={name}
        type={type}
        placeholder=" "
        autoComplete={autoComplete}
        min={min}
        required
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className="peer block w-full appearance-none border-0 border-b border-line bg-transparent pb-3 pt-7 text-[1.125rem] text-ink outline-none transition-colors placeholder:text-transparent focus:border-transparent [&::-webkit-calendar-picker-indicator]:opacity-50"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-7 origin-left text-[1.125rem] text-ink-mute transition-all duration-500 ease-[var(--ease-editorial)] peer-focus:top-0 peer-focus:scale-[0.72] peer-focus:text-ink peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-[0.72]"
      >
        {label}
      </label>
      {/* The underline draws from the left on focus */}
      <span aria-hidden className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-700 ease-[var(--ease-editorial)] peer-focus:scale-x-100" />
      {error && (
        <p id={`${id}-err`} className="mt-2 text-[0.8125rem] text-chili">
          {error}
        </p>
      )}
    </div>
  );
}

export function ReservationForm() {
  const [state, action, pending] = useActionState<ReserveState, FormData>(reserve, { status: "idle" });
  const [guests, setGuests] = useState(2);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AnimatePresence mode="wait">
      {state.status === "ok" ? (
        <motion.div
          key="ok"
          initial={{ opacity: 0, y: 24, clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 1.1, ease: EASE }}
          className="rounded-[3px] bg-canvas p-10 shadow-lift"
          role="status"
        >
          <p className="eyebrow text-ink-mute">Request received</p>
          <p className="display mt-4 text-[clamp(2.2rem,3.6vw,3.4rem)] leading-[1]">
            We’ll keep your seats warm, <span className="display-italic">{state.name}</span>.
          </p>
          <p className="mt-6 max-w-[28rem] text-[0.975rem] leading-relaxed text-ink-soft">
            A member of our team will confirm by email within the day. If plans change, simply reply to that note.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          action={action}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="grid gap-x-10 gap-y-10 md:grid-cols-2"
          noValidate
          aria-describedby={state.message ? "reserve-msg" : undefined}
        >
          <Field label="Your name" name="name" autoComplete="name" error={state.errors?.name} />
          <Field label="Email" name="email" type="email" autoComplete="email" error={state.errors?.email} />
          <Field label="Date" name="date" type="date" min={today} error={state.errors?.date} />

          <fieldset className="relative">
            <legend className="mb-3 text-[0.8125rem] text-ink">Guests</legend>
            <div className="flex items-center justify-between border-b border-line pb-2">
              <button type="button" aria-label="Fewer guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} className="grid h-10 w-10 place-items-center rounded-full text-xl transition-colors hover:bg-paper active:scale-90">
                −
              </button>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.output
                  key={guests}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="display text-[2rem] tabular-nums"
                  aria-live="polite"
                >
                  {guests}
                </motion.output>
              </AnimatePresence>
              <button type="button" aria-label="More guests" onClick={() => setGuests((g) => Math.min(12, g + 1))} className="grid h-10 w-10 place-items-center rounded-full text-xl transition-colors hover:bg-paper active:scale-90">
                +
              </button>
            </div>
            <input type="hidden" name="guests" value={guests} />
            {state.errors?.guests && <p className="mt-2 text-[0.8125rem] text-chili">{state.errors.guests}</p>}
          </fieldset>

          <fieldset className="md:col-span-2">
            <legend className="mb-4 text-[0.8125rem] text-ink">Sitting</legend>
            <div className="flex flex-wrap gap-3">
              {TIMES.map((t, i) => (
                <label key={t} className="relative cursor-pointer">
                  <input type="radio" name="time" value={t} defaultChecked={i === 1} className="peer sr-only" />
                  <span className="block rounded-full px-5 py-2.5 text-[0.875rem] ring-1 ring-inset ring-ink/20 transition-all duration-500 ease-[var(--ease-editorial)] hover:ring-ink/60 peer-checked:bg-ink peer-checked:text-canvas peer-checked:ring-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-4">
                    {t}
                  </span>
                </label>
              ))}
            </div>
            {state.errors?.time && <p className="mt-2 text-[0.8125rem] text-chili">{state.errors.time}</p>}
          </fieldset>

          <div className="group relative md:col-span-2">
            <label htmlFor="note" className="mb-2 block text-[0.8125rem] text-ink">
              Anything we should know? <span className="text-ink-mute">— allergies, occasions</span>
            </label>
            <textarea id="note" name="note" rows={2} className="peer block w-full resize-none border-0 border-b border-line bg-transparent pb-3 text-[1.0625rem] outline-none" />
            <span aria-hidden className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-700 ease-[var(--ease-editorial)] peer-focus:scale-x-100" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 md:col-span-2">
            <p id="reserve-msg" className={cn("text-[0.8125rem]", state.status === "error" ? "text-chili" : "text-ink-mute")} aria-live="polite">
              {state.message ?? "Bookings open sixty days ahead. Dress: as you like it."}
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? "Setting the table…" : "Request a table"}
            </Button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

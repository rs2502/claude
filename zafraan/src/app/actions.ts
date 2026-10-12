"use server";

export type ReserveState = {
  status: "idle" | "ok" | "error";
  message?: string;
  name?: string;
  errors?: Partial<Record<"name" | "email" | "date" | "guests" | "time", string>>;
};

const TIMES = ["18:30", "19:15", "20:00", "20:45"];

/**
 * Validates a reservation request. Wire `deliver()` to your booking system
 * (SevenRooms, Resy, an email relay…) — the UI contract stays the same.
 */
export async function reserve(_: ReserveState, data: FormData): Promise<ReserveState> {
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const date = String(data.get("date") ?? "");
  const time = String(data.get("time") ?? "");
  const guests = Number(data.get("guests") ?? 0);
  const note = String(data.get("note") ?? "").slice(0, 500);

  const errors: ReserveState["errors"] = {};
  if (name.length < 2) errors.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "An email we can reply to, please.";
  const day = new Date(`${date}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!date || Number.isNaN(day.getTime()) || day < today) errors.date = "Choose a date from today onwards.";
  else if ([1, 2].includes(day.getDay())) errors.date = "We are closed on Mondays and Tuesdays.";
  if (!Number.isInteger(guests) || guests < 1 || guests > 12) errors.guests = "Between one and twelve guests.";
  if (!TIMES.includes(time)) errors.time = "Choose a sitting.";

  if (Object.keys(errors).length) return { status: "error", errors, message: "A few details need another look." };

  await deliver({ name, email, date, time, guests, note });
  return { status: "ok", name: name.split(" ")[0] };
}

async function deliver(_req: { name: string; email: string; date: string; time: string; guests: number; note: string }) {
  // Intentionally a no-op in this build: plug in your reservation provider here.
  await new Promise((r) => setTimeout(r, 650));
}

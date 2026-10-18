// Day and month boundaries in India (UTC+5:30, no daylight saving), for daily and monthly caps.
const IST_OFFSET_MS = 5.5 * 3_600_000;

// Shifted so the UTC getters read Indian wall-clock time.
const ist = (now: Date) => new Date(now.getTime() + IST_OFFSET_MS);

export function startOfIstDay(now = new Date()) {
  const t = ist(now);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - IST_OFFSET_MS);
}

export function startOfIstMonth(now = new Date()) {
  const t = ist(now);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1) - IST_OFFSET_MS);
}

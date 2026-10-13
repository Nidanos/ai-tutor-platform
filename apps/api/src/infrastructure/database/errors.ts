// Drizzle wraps the Postgres error; its code is on `cause`.
export const isUniqueViolation = (err: unknown) => (err as { cause?: { code?: string } }).cause?.code === "23505";

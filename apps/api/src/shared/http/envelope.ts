// Every response has one shape (spec §36), so clients handle success and errors the same way.
export const ok = <T>(data: T) => ({ success: true as const, data });

export const fail = (code: string, message: string, details?: unknown) => ({
  success: false as const,
  error: { code, message, details },
});

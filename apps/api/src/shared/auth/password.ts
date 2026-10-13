import argon2 from "argon2";

// argon2id with the library defaults (64 MB, 3 passes): above OWASP's minimum.
export const hashPassword = (password: string) => argon2.hash(password);
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);

// Verified against when the email doesn't exist, so a wrong email takes as long as a wrong password.
export const DUMMY_HASH = await hashPassword("timing-equaliser");

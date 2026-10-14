// Under 18 is a child under the DPDP Act: a parent must approve the account.
export const ADULT_AGE = 18;

// Whole years on a given day; dob is "YYYY-MM-DD".
export function ageOn(dob: string, on = new Date()) {
  const [year, month, day] = dob.split("-").map(Number);
  const thisMonth = on.getUTCMonth() + 1;
  const hadBirthday = thisMonth > month || (thisMonth === month && on.getUTCDate() >= day);
  return on.getUTCFullYear() - year - (hadBirthday ? 0 : 1);
}

export const isAdult = (dob: string, on?: Date) => ageOn(dob, on) >= ADULT_AGE;

/**
 * F4.1 — Phone number masking utility.
 *
 * Unauthenticated callers see: +855 *** *** 789 (last 3 digits only)
 * Authenticated callers see the full number.
 *
 * F4.2 — Email guard utility.
 * Strips email from any object before returning it to unauthenticated callers.
 *
 * F4.5 — Password guard utility.
 * safeUser() strips passwordHash (and any other sensitive hashes) from a raw
 * Prisma user record before it is sent over the wire.
 */

/**
 * Mask a Cambodia phone number for public display.
 * "+85512345678" → "+855 *** *** 678"
 * Returns null if the number is null/undefined.
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")           // strip non-digits
  if (digits.length < 4) return "***"
  const last3 = digits.slice(-3)
  return `+855 *** *** ${last3}`
}

/**
 * Apply phone masking to an object that has a `phone` field.
 * Returns the object with `phone` replaced by the masked value.
 */
export function withMaskedPhone<T extends { phone?: string | null }>(obj: T): T {
  return { ...obj, phone: maskPhone(obj.phone) }
}

/**
 * Strip `email` from any object — used when the caller is not the account owner
 * and not an admin.
 */
export function withoutEmail<T extends { email?: string | null }>(obj: T): Omit<T, "email"> {
  const { email: _email, ...rest } = obj
  return rest
}

/**
 * F4.5 — Strip sensitive credential fields from a raw user object.
 * Use this whenever you load a user record without an explicit Prisma `select`.
 */
export function safeUser<T extends { passwordHash?: string; password?: string }>(
  user: T,
): Omit<T, "passwordHash" | "password"> {
  const { passwordHash: _hash, password: _password, ...rest } = user
  return rest
}

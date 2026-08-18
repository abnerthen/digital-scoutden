// What makes a password acceptable, and which parts a given one is missing.
//
// Supabase enforces these server-side (auth.password_requirements =
// lower_upper_letters_digits_symbols) and rejects a bad one with a wall of
// literal character classes:
//
//   Password should contain at least one character of each of the following:
//   abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789, …
//
// which arrives only after submitting and does not say which part failed.
// Checking the same rules as you type turns that into something answerable.

/**
 * GoTrue's symbol set, copied exactly.
 *
 * Deliberately not /[^A-Za-z0-9]/ — that would accept a space, an accented
 * letter or an emoji, which the server then rejects. Matching a character
 * against a listed set also avoids getting the escaping wrong in a regex
 * containing both quote styles and a backslash.
 */
export const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~"

export const MIN_PASSWORD_LENGTH = 8

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: `at least ${MIN_PASSWORD_LENGTH} characters`,
    test: (pw) => pw.length >= MIN_PASSWORD_LENGTH,
  },
  { id: 'lower',   label: 'a small letter',      test: (pw) => /[a-z]/.test(pw) },
  { id: 'upper',   label: 'a capital letter',    test: (pw) => /[A-Z]/.test(pw) },
  { id: 'number',  label: 'a number',            test: (pw) => /[0-9]/.test(pw) },
  {
    id: 'symbol',
    label: 'a special character',
    test: (pw) => [...pw].some((ch) => PASSWORD_SYMBOLS.includes(ch)),
  },
]

/** The rules this password does not yet satisfy, in display order. */
export function missingRequirements(password = '') {
  return PASSWORD_RULES.filter((rule) => !rule.test(password))
}

/** Every rule satisfied? */
export function passwordIsValid(password = '') {
  return missingRequirements(password).length === 0
}

/** One sentence naming what is still missing, or null when nothing is. */
export function describeMissing(password = '') {
  const missing = missingRequirements(password).map((r) => r.label)
  if (missing.length === 0) return null
  const list =
    missing.length === 1
      ? missing[0]
      : `${missing.slice(0, -1).join(', ')} and ${missing.at(-1)}`
  return `Still needs ${list}.`
}

import { describe, it, expect } from 'vitest'
import {
  PASSWORD_RULES, PASSWORD_SYMBOLS, missingRequirements, passwordIsValid, describeMissing,
} from './password'

describe('password requirements', () => {
  it('accepts one that satisfies every rule', () => {
    expect(passwordIsValid('Password123!')).toBe(true)
    expect(describeMissing('Password123!')).toBe(null)
  })

  it('names every rule an empty password misses', () => {
    expect(missingRequirements('').map(r => r.id))
      .toEqual(['length', 'lower', 'upper', 'number', 'symbol'])
  })

  it.each([
    ['password123!', 'upper'],
    ['PASSWORD123!', 'lower'],
    ['Password!!!!', 'number'],
    ['Password1234', 'symbol'],
    ['Pw1!', 'length'],
  ])('%s is missing %s', (pw, expected) => {
    expect(missingRequirements(pw).map(r => r.id)).toEqual([expected])
  })

  // REGRESSION: /[^A-Za-z0-9]/ would call these acceptable, and Supabase would
  // then reject the password — the client saying yes and the server saying no
  // is the exact confusion this replaced.
  it.each(['Passw0rd£', 'Passw0rd é', 'Passw0rd🎪'])(
    'does not count a character outside GoTrue\'s symbol set: %s',
    (pw) => expect(missingRequirements(pw).map(r => r.id)).toContain('symbol')
  )

  it.each([...'!@#$%^&*()_+-=[]{};\':"|<>?,./`~'])(
    'accepts %s as a special character',
    (ch) => expect(passwordIsValid(`Password1${ch}`)).toBe(true)
  )

  it('lists the symbols GoTrue actually allows', () => {
    // A space is not in the set, and is the most likely thing to be typed.
    expect(PASSWORD_SYMBOLS.includes(' ')).toBe(false)
    expect(PASSWORD_SYMBOLS.includes('!')).toBe(true)
  })
})

describe('describeMissing', () => {
  it('reads as a sentence for one missing rule', () => {
    expect(describeMissing('Password1234')).toBe('Still needs a special character.')
  })

  it('joins several with commas and "and"', () => {
    expect(describeMissing('password')).toBe(
      'Still needs a capital letter, a number and a special character.'
    )
  })

  it('keeps the rules in display order', () => {
    expect(missingRequirements('').map(r => r.label))
      .toEqual(PASSWORD_RULES.map(r => r.label))
  })
})

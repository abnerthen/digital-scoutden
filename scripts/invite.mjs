#!/usr/bin/env node
// Sends an invite against the LOCAL Supabase stack and prints the resulting
// link, so the set-password flow can be exercised without the Edge Function
// that will eventually send these for real.
//
//   npm run invite -- priya@troop.test
//
// Invite tokens are single use, so re-inviting the same address deletes the
// pending auth user first. That is safe locally and refused anywhere else.

import { execFileSync } from 'node:child_process'

const email = process.argv[2]
if (!email) {
  console.error('Usage: npm run invite -- <email>')
  process.exit(1)
}

const status = JSON.parse(
  // stderr ignored: `status` warns about optional containers that are stopped.
  execFileSync('npx', ['supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
)
const apiUrl = status.API_URL
const serviceKey = status.SERVICE_ROLE_KEY
const mailpit = status.MAILPIT_URL

// The service_role key bypasses RLS entirely. This script must never be aimed
// at a deployed project.
if (!/^https?:\/\/(127\.0\.0\.1|localhost)\b/.test(apiUrl)) {
  console.error(`Refusing to run: ${apiUrl} is not a local stack.`)
  process.exit(1)
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
}

// Clear a pending invite for this address so the token is always fresh.
const users = await fetch(
  `${apiUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
  { headers }
).then(r => r.json())

for (const user of users.users ?? []) {
  if (user.email?.toLowerCase() !== email.toLowerCase()) continue
  await fetch(`${apiUrl}/auth/v1/admin/users/${user.id}`, { method: 'DELETE', headers })
  console.log(`Removed the existing auth user for ${email}`)
}

const redirectTo = `${process.env.APP_URL ?? 'http://localhost:5173'}/auth/set-password`
const res = await fetch(
  `${apiUrl}/auth/v1/invite?redirect_to=${encodeURIComponent(redirectTo)}`,
  {
    method: 'POST',
    headers,
    // must_set_password is what keeps Root from letting them into the app
    // before they have credentials.
    body: JSON.stringify({ email, data: { must_set_password: true } }),
  }
)

if (!res.ok) {
  console.error(`Invite failed (${res.status}): ${await res.text()}`)
  process.exit(1)
}

// Pull the link straight out of the mailbox rather than making you go find it.
const { messages } = await fetch(`${mailpit}/api/v1/messages?limit=1`).then(r => r.json())
const message = await fetch(`${mailpit}/api/v1/message/${messages[0].ID}`).then(r => r.json())
const link = (message.Text ?? '').match(/https?:\/\/\S*?token=\S+/)?.[0]

console.log(`\nInvited ${email}`)
console.log(`\n  ${link ?? `(link not found — read it at ${mailpit})`}\n`)
console.log(`Mailbox: ${mailpit}`)

# Plan: Admin Management Page

Add a section in your admin dashboard where you can grant or revoke the admin role for any registered user by email — no more manual database changes.

## What you'll get

- A new "Admins" tab/section inside the existing `/admin` dashboard.
- A list of current admins (email, name, when they became admin).
- An input to add a new admin by email address.
- A "Revoke" button next to each admin to remove their admin access (with a safety rule: you cannot remove your own admin role, so you can never lock yourself out).

## How it works (technical)

1. **Server functions** in a new `src/lib/admin-users.functions.ts`, each guarded by the existing admin check (looks up your `admin` row in `user_roles` — same as the technician verification console):
   - `listAdmins` — returns users who hold the admin role, with their profile name/email.
   - `grantAdminByEmail` — looks up the user by email via the privileged server client (loaded inside the handler), inserts an `admin` row into `user_roles`. Returns a clear error if no account exists with that email.
   - `revokeAdmin` — deletes the admin role row for the given user, but refuses when the target is the caller themselves.
2. **UI**: add an "Admins" section to `src/routes/_authenticated/admin.tsx` with the list, an email input + "Make admin" button, and revoke buttons with a confirmation.
3. Only admins can reach these functions — every call re-verifies the caller's admin role server-side, so customers/technicians cannot grant themselves admin even if they call the endpoint directly.

## Notes

- The person must have signed up to the app first — granting by email only works for existing accounts.
- Your own account stays protected by the existing platform-owner auto-admin logic.

## Verification

- Typecheck + build pass.
- Browser test signed in as your admin account: open `/admin`, see the Admins section, grant and revoke a test role, and confirm a non-admin cannot call the functions.

# Show "My Requests" to everyone on the dashboard

Right now the dashboard hides the "My Requests" and "Book a Repair" buttons from approved technicians and admins — only non-technician customers see them. Anyone can create a repair request, so everyone should be able to view the ones they created.

## What changes

- "My Requests" button is always shown in Quick Actions, for customers, technicians, and admins alike.
- "Book a Repair" is also always shown, so a technician or admin can raise a request for their own appliance.
- Technician-only actions (Find Nearby Jobs, My Jobs) and the admin action stay exactly as they are.
- The "Requests" stat card currently always reads 0. It will show the real count of repair requests the signed-in user created.
- Recent Activity will list the user's 3 most recent requests (device, status, date) with a link to the full list, instead of the static "No recent activity yet." text. Empty state stays when there are none.

## Technical notes

- `src/routes/_authenticated/dashboard.tsx`: remove the `!isTechnicianApproved` conditions around the Book a Repair / My Requests links; add a query using the existing `getMyRepairRequests` server function from `src/lib/repairs.functions.ts` to drive the count and recent list.
- The existing `/requests` route already fetches the caller's own requests via `getMyRepairRequests`, which is scoped to the authenticated user, so no backend or policy changes are needed.

# AMC requests and asset service contracts

## Goal
Add an AMC workflow alongside repairs. Customers request coverage for one registered asset, technicians offer terms and pricing, and payment activates a time-limited contract. Repairs for an actively covered asset go directly to its contracted technician; after cancellation or expiry they return to the normal technician marketplace.

## Customer experience
- Add **AMC** actions on the dashboard and asset screens, with pages to create and manage AMC requests/contracts.
- Require a customer-owned asset and let the customer choose a 30, 90, 180, or 365-day term.
- Block another open or active AMC process for the same asset, with a clear link to the existing record.
- Show matching technicians’ offers and shared AMC conversation, using the same interest and selection pattern as repairs.
- After selecting an offer, show the agreed price and a payment action. Activate the AMC only after payment.
- Show contract status, start/end dates, days remaining, fixed six-hour repair-response SLA, technician, payment, cancellation, and renewal/reactivation actions.
- Allow immediate customer cancellation. Future repairs then use the normal open marketplace; already-created repairs remain with their recorded assignment.
- On a completed/paid repair, show **Convert to AMC**. Prefill the asset and completed repair’s technician, create a targeted AMC request visible only to that technician, and collect the remaining term/details.

## Technician experience
- Add a separate **AMC requests** dashboard action and page.
- Show matching open AMC opportunities plus direct conversion invitations.
- Let technicians submit a priced offer and continue messaging after offering.
- Show assigned/active AMCs with contract countdown and status.
- Opening an AMC shows the covered asset, customer-visible contract details, and all past and active repair requests for that asset.
- Repairs created under an active AMC appear in the AMC section and are directly assigned to the contracted technician with a response due six hours after creation.

## Contract and repair rules
- Add AMC request, offer, message, and contract records linked to customer assets and technicians.
- Enforce one active contract per asset in the database with a partial unique index, plus friendly server-side checks. Also prevent duplicate simultaneous open/selected AMC requests for the asset.
- Activate a contract transactionally after the selected offer is paid; record immutable start/end dates and the selected duration.
- When creating a repair, securely resolve any active, unexpired AMC for the owned asset. If found, create an accepted assignment for its technician and keep the repair out of the public nearby-jobs feed. Otherwise preserve the existing open-request flow.
- Expired or cancelled contracts never auto-assign new repairs.
- Preserve all historical links after expiry, cancellation, or renewal.

## Expiry and reminders
- Process contract expiry daily in the database and mark elapsed contracts expired.
- Send the customer one in-app reminder seven days before expiry and another when the AMC expires, with a link to reactivate by creating a new AMC request.
- Also re-check expiry during AMC and repair actions so routing remains correct even if scheduled processing is delayed.

## Security and access
- Customers can create/read their own AMC records, select/pay offers, cancel contracts, and read their contract conversations.
- Approved matching technicians can read open AMC requests and submit offers; targeted conversion requests are visible only to the invited technician.
- Only the selected/contracted technician can access active contract details and the asset’s AMC repair history.
- Derive customer and technician identity from the signed-in session; never trust IDs supplied by the browser.
- Add explicit grants, row-level access policies, indexes, and validation functions in one migration.

## Pages and app integration
- Add customer AMC list/create/detail pages and technician AMC dashboard/detail pages.
- Add AMC links to the shared dashboard, asset actions, notification links, and completed repair detail.
- Reuse the app’s existing cards, status badges, conversations, offer selection, invoice-style payment status, and notification patterns.
- Add unique page titles/descriptions and mobile-friendly empty, loading, error, cancelled, expired, and SLA-overdue states.

## Verification
- Verify customer-owned asset selection and duplicate-AMC blocking.
- Verify matching technician offer/chat, customer selection, payment activation, and one-active-contract enforcement.
- Verify active-AMC repair auto-assignment, six-hour response deadline, dashboard visibility, and hidden public marketplace visibility.
- Verify cancellation and expiry restore normal public repair matching.
- Verify completed-repair conversion is prefilled and only reaches the prior technician.
- Verify customer and technician access boundaries, reminders, desktop/mobile layouts, and a clean build.

## Assumptions
- AMC payment uses the app’s current recorded payment flow, matching repair invoice payment; no new external payment provider is added.
- “Days left” is calendar-day countdown to the stored end date.
- Reactivation creates a new AMC request/contract so prior contract history remains intact.

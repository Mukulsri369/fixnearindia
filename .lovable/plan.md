Plan: FixNear India — Electronics Repair Technician Marketplace

**Phase 1 — Foundation (this turn)**
- Create database schema for profiles, categories, technicians, repair requests, technician categories, reviews, documents, locations, notifications.
- Set up user roles table with `admin`, `technician`, `customer` enum.
- Implement RLS policies and GRANTs so authenticated users can access their own data and admins can manage approvals.
- Build a public landing page with hero, categories, features, CTA, and footer.
- Add public routes: About, Contact, Privacy, Terms, Register as Technician, Login.
- Set up root layout, navigation, and dark/light mode support.

**Phase 2 — Authentication & User Profiles (next turn)**
- Implement email/password and Google OAuth sign-in via Lovable Cloud auth.
- Add `profiles` table with auto-creation trigger on signup.
- Build `/auth` page for sign-in/sign-up.
- Build `/reset-password` page.
- Create customer profile setup and technician registration forms.
- Add protected `_authenticated` routes for customer and technician dashboards.

**Phase 3 — Customer Flow (next turn)**
- Customer dashboard: view and create repair requests.
- Create repair request form with device category, brand, model, issue, priority, preferred visit time, up to 5 images, and GPS location.
- Matching server function: find technicians within service radius for the requested category, sorted by distance, rating, experience, and availability.
- Technician request list and accept/reject workflow.
- Reveal contact details only after a technician accepts a request.

**Phase 4 — Technician & Admin Flow (next turn)**
- Technician dashboard: manage profile, service areas, availability, requests, ratings, and reviews.
- Admin panel: approve/reject technicians, manage users, categories, repair requests, and view basic analytics.
- Google Maps placeholder UI (the user has not provided an API key yet; geocoding will fall back to city/state text search).

**Notes**
- This plan uses Lovable Cloud for auth, database, and storage.
- Role checks use the `user_roles` table + `has_role` security definer function.
- The admin approval workflow is required before technician profiles are visible to customers.
- The matching engine will be a server function with location distance calculation.
- No Google Maps API key is provided yet, so maps are mocked/placeholder until one is supplied.
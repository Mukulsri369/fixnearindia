<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Customer repair requests must reference an owned `customer_assets` record; this keeps each job tied to a verified asset while preserving legacy requests.
- AMC lifecycle mutations use authenticated server functions with privileged writes only after ownership or technician checks; this keeps multi-row offer, payment, cancellation, and assignment transitions consistent.
- Admin-wide request lists use authenticated, role-checked server functions through the caller-scoped database client; this preserves row-level security as defense in depth.
- Share the paginated admin request overview between the main dashboard and admin console; this keeps both lists consistent without truncating access.
- Keep request visibility and location rules in a browser-safe module with focused tests; this verifies permissions and filters independently of presentation.

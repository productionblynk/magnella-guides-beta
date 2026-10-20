# Magnella Account Page

Customer-facing account page served at `account.magnella.com`. Lets a customer log in via magic link and view their past guides.

## What's safe to edit

- `index.html` — page markup, text content, layout
- `styles.css` — colors, typography, spacing, visual design
- Any additional CSS or static asset files you add

## What is OFF-LIMITS

Files inside `/account/core/` are the Supabase client, authentication flow, and database queries. **DO NOT MODIFY them.** Editing those files breaks:
- Customer login
- Guide retrieval
- Session management

Every file in `/core/` has a `DO NOT EDIT` banner at the top. If you (or an AI agent) need something changed in that area, flag it — don't guess.

## Visual direction

See the design brief maintained by B-Lynk + the generated guide templates for brand reference (Cormorant Garamond + Nunito Sans + Dancing Script; sky-blue + soft-gold palette; off-white backgrounds). The account page should feel like a quiet companion to the guides, not a loud dashboard.

## Deployment

Pushes to `main` auto-deploy to GitHub Pages (serving `account.magnella.com` once Brooke configures the DNS CNAME).

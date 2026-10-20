# Magnella Account Page

Customer-facing account page at `account.magnella.com` (once DNS is live).
Lets a customer log in via magic link and view their past guides.

## Files

```
index.html    Page markup (safe to edit for structural changes)
style.css     All visual styling (safe to edit for colors/typography/layout)
account.js    Supabase auth + guide list + state machine (DO NOT EDIT behavior)
README.md     This file
```

## What's safe to edit

- `index.html` — markup, text content, structure
- `style.css` — colors, fonts, spacing, visual design

## What is OFF-LIMITS

- `account.js` — Supabase authentication, session handling, database queries.
  Editing this file breaks customer login and guide access. If you need something
  changed there, flag to B-Lynk engineering — don't guess.

## Design reference

Based on the design agent's handoff (2026-10-19). Pixel specs maintained in
`docs/account-page-design-brief.md`. The design agent delivered a reference
implementation we adopted here with these changes:

- Wired Supabase prod URL + publishable key into `account.js`
- Changed query from a single `guides` view to a `reports → intakes` join
  matching our actual schema
- Removed `shouldCreateUser: false` — our customers may be first-time logging
  in after a prior guide purchase, so the magic link flow needs to create
  their auth user on first sign-in

## Demo mode (no Supabase)

For design iteration or review without burning auth emails, append `?demo`
to the URL:

- `?demo` — click through sign-in → sent → guide list (mock data)
- `?demo=empty` — jump to the empty state
- `?demo&signed-in` — jump straight to the list

## Deployment

Pushes to `main` auto-deploy to GitHub Pages. Also auto-mirror to
`productionblynk/magnella-account-mirror` via `.github/workflows/mirror.yml`.

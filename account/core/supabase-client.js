// ============================================
// DO NOT MODIFY THIS FILE
// Editing breaks customer authentication.
// Visual changes go in /account/index.html or /account/styles.css
// Contact B-Lynk for any changes here.
// ============================================
//
// Supabase client initialization.
//
// Both the URL and publishable key are safe to expose in browser code —
// Supabase designs the publishable key to be public. Security comes from
// Row Level Security (RLS) policies on the database side, which filter
// every query to only show the signed-in user's own data.

(function () {
  // Prod Supabase project (eueefsdmdxeluhnbnffq).
  const SUPABASE_URL = "https://eueefsdmdxeluhnbnffq.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_N6LQ3dtHkMAdp9JD0GfdEg_vW_uUUjc";

  // Wait for the Supabase JS SDK (loaded from CDN in index.html).
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase SDK not loaded. Check <script> order in index.html.");
    return;
  }

  // Expose a single global client. All other core files consume this.
  window.magnellaSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        // Persist session in browser localStorage. User stays signed in
        // across page reloads until they explicitly sign out.
        persistSession: true,
        // Automatically refresh JWTs when they expire.
        autoRefreshToken: true,
        // Pick up magic link tokens from the URL on page load.
        detectSessionInUrl: true,
      },
    },
  );
})();

// ============================================
// DO NOT MODIFY THIS FILE
// Editing breaks customer authentication.
// Visual changes go in /account/index.html or /account/styles.css
// Contact B-Lynk for any changes here.
// ============================================
//
// Magic-link auth flow.
//
// Flow:
//   1. User enters email, clicks "Send me a sign-in link"
//   2. magnellaAuth.sendMagicLink(email) → Supabase emails them a one-time link
//   3. User clicks link in email → opens this page with ?code=... in URL
//   4. Supabase SDK (configured with detectSessionInUrl: true) auto-exchanges
//      the code for a session on page load
//   5. magnellaAuth.getSession() returns the signed-in user

(function () {
  const supabase = window.magnellaSupabase;
  if (!supabase) {
    console.error("magnellaSupabase not initialized. Check script order.");
    return;
  }

  window.magnellaAuth = {
    /** Send a magic-link email. Returns {ok: true} or {ok: false, error: string}. */
    sendMagicLink: async (email) => {
      const trimmed = (email || "").trim().toLowerCase();
      if (!trimmed || !trimmed.includes("@")) {
        return { ok: false, error: "Please enter a valid email address." };
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          // Where Supabase sends the user after they click the link.
          // Defaults to the current page URL, which is what we want.
          emailRedirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) {
        return { ok: false, error: friendlyAuthError(error) };
      }
      return { ok: true };
    },

    /** Current session, or null if not signed in. */
    getSession: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("getSession failed:", error);
        return null;
      }
      return data.session;
    },

    /** User's email (null if not signed in). */
    getUserEmail: async () => {
      const session = await window.magnellaAuth.getSession();
      return session?.user?.email ?? null;
    },

    /** Sign out. Returns {ok: true/false}. */
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { ok: !error };
    },

    /** Register a callback that fires when auth state changes (sign in, sign
     *  out, token refresh). Useful for the app to react to the magic-link
     *  session appearing after redirect. */
    onAuthChange: (callback) => {
      return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
      });
    },
  };

  function friendlyAuthError(err) {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("rate limit")) return "Too many sign-in attempts. Try again in a few minutes.";
    if (msg.includes("invalid email")) return "That email address looks off. Check it and try again.";
    if (msg.includes("smtp")) return "We couldn't send the email right now. Please try again shortly.";
    return "Something went wrong sending the link. Please try again.";
  }
})();

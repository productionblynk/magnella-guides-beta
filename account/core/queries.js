// ============================================
// DO NOT MODIFY THIS FILE
// Editing breaks customer data access.
// Visual changes go in /account/index.html or /account/styles.css
// Contact B-Lynk for any changes here.
// ============================================
//
// Supabase queries for the signed-in user.
//
// RLS policies on the server (migration 20261019000000_allow_authenticated_read_own_data.sql)
// filter every query automatically — a signed-in user only sees their own
// intakes and reports. We don't need to filter by email in the client code;
// the database enforces it.

(function () {
  const supabase = window.magnellaSupabase;
  if (!supabase) {
    console.error("magnellaSupabase not initialized.");
    return;
  }

  // Hosting URL template for generated guides. Keep in sync with the
  // GitHub Pages repo the generator pushes guides to.
  const GUIDE_URL_TEMPLATE = "https://productionblynk.github.io/magnella-guides-beta/{id}.html";

  window.magnellaQueries = {
    /** Fetch all guides for the signed-in user. Joins reports → intakes to
     *  pick up the recipient first name. Returns an array of
     *  { id, product, first_name, created_at, url, delivered_at } sorted
     *  newest-first. Empty array if no guides. Throws on error. */
    listGuides: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id,
          product,
          created_at,
          delivered_at,
          validation_status,
          intakes!inner (
            legal_name,
            email
          )
        `)
        .eq("validation_status", "pass")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("listGuides failed:", error);
        throw new Error(error.message || "Failed to load guides");
      }

      return (data || []).map((row) => ({
        id: row.id,
        product: row.product,
        first_name: row.intakes?.legal_name || "You",
        created_at: row.created_at,
        delivered_at: row.delivered_at,
        url: GUIDE_URL_TEMPLATE.replace("{id}", row.id),
      }));
    },
  };
})();

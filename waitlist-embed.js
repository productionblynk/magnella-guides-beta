(function () {
  var ENDPOINT = "https://eueefsdmdxeluhnbnffq.supabase.co/functions/v1/waitlist";
  var APIKEY = "sb_publishable_N6LQ3dtHkMAdp9JD0GfdEg_vW_uUUjc";

  function $(id) { return document.getElementById(id); }

  function init() {
    var form = $("magnella-waitlist");
    if (!form) {
      console.warn("[magnella-waitlist] form #magnella-waitlist not found");
      return;
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      var emailEl = $("magnella-waitlist-email");
      var productEl = $("magnella-waitlist-product");
      var submitEl = $("magnella-waitlist-submit");
      var successEl = $("magnella-waitlist-success");
      var errorEl = $("magnella-waitlist-error");

      if (!emailEl) {
        console.warn("[magnella-waitlist] missing #magnella-waitlist-email");
        return;
      }
      var email = (emailEl.value || "").trim();
      var product = productEl ? (productEl.value || "lift-light") : "lift-light";

      if (successEl) successEl.hidden = true;
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ""; }
      if (submitEl) submitEl.disabled = true;

      try {
        var res = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": APIKEY,
            "Authorization": "Bearer " + APIKEY,
          },
          body: JSON.stringify({ email: email, product: product }),
        });
        var data = null;
        try { data = await res.json(); } catch (_) { /* ignore */ }

        if (res.ok && data && data.ok) {
          if (successEl) successEl.hidden = false;
          form.reset();
        } else {
          var msg = (data && data.error) || "Something went wrong. Please try again.";
          if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; }
        }
      } catch (err) {
        if (errorEl) { errorEl.textContent = "Network error. Please try again."; errorEl.hidden = false; }
      } finally {
        if (submitEl) submitEl.disabled = false;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

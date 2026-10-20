// Account page UI glue — connects the visual layer to magnellaAuth + magnellaQueries.
//
// Safe to edit for UI changes. For auth/query/data logic see /account/core/.

(async function () {
  // --- DOM references ---
  const views = {
    login: document.getElementById("view-login"),
    checkEmail: document.getElementById("view-check-email"),
    guides: document.getElementById("view-guides"),
    error: document.getElementById("view-error"),
  };

  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const loginSubmit = document.getElementById("login-submit");
  const loginError = document.getElementById("login-error");
  const confirmEmail = document.getElementById("confirm-email");
  const backToLogin = document.getElementById("back-to-login");
  const userEmail = document.getElementById("user-email");
  const guidesLoading = document.getElementById("guides-loading");
  const guidesEmpty = document.getElementById("guides-empty");
  const guidesList = document.getElementById("guides-list");
  const signoutBtn = document.getElementById("signout");
  const errorDetail = document.getElementById("error-detail");
  const retryBtn = document.getElementById("retry");

  // --- View switching ---
  function showView(name) {
    for (const [key, el] of Object.entries(views)) {
      el.hidden = key !== name;
    }
  }

  // --- Login submit ---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    loginSubmit.disabled = true;
    loginSubmit.textContent = "Sending…";
    const email = emailInput.value.trim();
    const result = await window.magnellaAuth.sendMagicLink(email);
    loginSubmit.disabled = false;
    loginSubmit.textContent = "Send me a sign-in link";
    if (!result.ok) {
      loginError.textContent = result.error;
      loginError.hidden = false;
      return;
    }
    confirmEmail.textContent = email;
    showView("checkEmail");
  });

  backToLogin.addEventListener("click", () => {
    emailInput.value = "";
    showView("login");
  });

  // --- Sign out ---
  signoutBtn.addEventListener("click", async () => {
    await window.magnellaAuth.signOut();
    emailInput.value = "";
    showView("login");
  });

  // --- Retry ---
  retryBtn.addEventListener("click", () => {
    initialize();
  });

  // --- Render guide list ---
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function productLabel(key) {
    if (key === "launch-light") return "Launch Light";
    if (key === "lift-light") return "Lift Light";
    return key;
  }

  async function loadGuides() {
    guidesLoading.hidden = false;
    guidesEmpty.hidden = true;
    guidesList.hidden = true;
    guidesList.innerHTML = "";

    let guides;
    try {
      guides = await window.magnellaQueries.listGuides();
    } catch (err) {
      errorDetail.textContent = err.message || "Couldn't load your guides.";
      showView("error");
      return;
    }

    guidesLoading.hidden = true;

    if (!guides.length) {
      guidesEmpty.hidden = false;
      return;
    }

    for (const g of guides) {
      const li = document.createElement("li");
      li.className = "guide-row";
      li.innerHTML = `
        <div class="guide-primary">
          <span class="guide-name">${escape(g.first_name)}</span>
          <span class="guide-product">${escape(productLabel(g.product))}</span>
        </div>
        <div class="guide-date">${escape(formatDate(g.delivered_at || g.created_at))}</div>
        <a class="guide-view-link" href="${escape(g.url)}" target="_blank" rel="noopener">View guide</a>
      `;
      guidesList.appendChild(li);
    }
    guidesList.hidden = false;
  }

  function escape(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // --- Initial route ---
  async function initialize() {
    // Hide all views until we know the state.
    showView("login");
    loginError.hidden = true;

    const email = await window.magnellaAuth.getUserEmail();
    if (email) {
      userEmail.textContent = email;
      showView("guides");
      await loadGuides();
    } else {
      showView("login");
    }
  }

  // React to auth state changes (e.g. magic-link redirect lands + creates session).
  window.magnellaAuth.onAuthChange((session) => {
    if (session?.user?.email) {
      userEmail.textContent = session.user.email;
      showView("guides");
      loadGuides();
    }
  });

  initialize();
})();

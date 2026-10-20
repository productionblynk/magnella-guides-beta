/* Magnella account page.
 * Adopted from design agent's reference 2026-10-19 with these customizations:
 *   - SUPABASE_URL + ANON_KEY wired to Magnella prod project
 *   - fetchGuides joins reports -> intakes (our schema) instead of a single view
 *   - shouldCreateUser left as default (true) because customers may be first-time
 *     logging in after a prior guide purchase. The design agent's privacy stance
 *     (shouldCreateUser:false, show "sent" anyway) assumes accounts exist; ours
 *     need to be created on first login.
 *
 * Open with ?demo (or ?demo=empty, ?demo&signed-in) to click through states
 * without Supabase. Useful for design iteration without burning auth emails.
 */
(() => {
  const SUPABASE_URL = 'https://eueefsdmdxeluhnbnffq.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_N6LQ3dtHkMAdp9JD0GfdEg_vW_uUUjc';
  // Guide HTML hosting URL template. Keep in sync with where the generator pushes.
  const GUIDE_URL_TEMPLATE = 'https://productionblynk.github.io/magnella-guides-beta/{id}.html';
  // true = rows show "For {name}" + "View {name}'s guide" (gifts possible).
  // false = rows show product + date only, button "View your guide".
  // Scope decision 2026-10-19: v1 is self-recipient only but the UX supports gifts.
  const SHOW_RECIPIENT = true;
  const RESEND_COOLDOWN_S = 30;

  const params = new URLSearchParams(location.search);
  const DEMO = params.has('demo');
  const sb = !DEMO && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const COPY = {
    empty: "We'll need your email to send the link.",
    invalid: "That email doesn't look quite right. Could you check it once more?",
    failed: 'Something got in the way on our end. Please try again in a moment.',
    rateLimited: "We've just sent you a link. Give it a minute, then you can ask for another.",
    resent: 'Sent again. Give it a minute or two to arrive.',
    expired: "That sign-in link has expired. They only last an hour, to keep your guides private. Enter your email and we'll send a fresh one.",
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const views = { signin: $('#view-signin'), sent: $('#view-sent'), account: $('#view-account') };
  const form = $('#signin-form');
  const input = $('#email');
  const err = $('#email-error');
  let lastEmail = '';
  let cooldownTimer = null;

  function show(view) {
    Object.entries(views).forEach(([k, el]) => (el.hidden = k !== view));
    const signedIn = view === 'account';
    $$('[data-when="signed-in"]').forEach((el) => (el.hidden = !signedIn));
    $$('[data-when="signed-out"]').forEach((el) => (el.hidden = signedIn));
    const focusTarget = view === 'sent' ? $('#sent-title') : view === 'account' ? $('#account-title') : null;
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  }

  function setError(msg) {
    err.textContent = msg || '';
    err.hidden = !msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function setNotice(msg) {
    const n = $('#signin-notice');
    n.textContent = msg || '';
    n.hidden = !msg;
  }
  input.addEventListener('input', () => setError(''));

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  async function sendLink(email) {
    if (DEMO) return { error: null };
    return sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: location.origin + location.pathname,
        // Allow first-time logins. Customers may have purchased a guide
        // (intake row exists) before ever creating an auth account; the
        // magic-link flow needs to be able to create their auth user on
        // first sign-in. RLS filters by email so no data leak if they
        // happen to not have intakes.
      },
    });
  }
  const isRateLimit = (e) => e && (e.status === 429 || /rate|seconds/i.test(e.message || ''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!email) return setError(COPY.empty);
    if (!validEmail(email)) return setError(COPY.invalid);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const { error } = await sendLink(email);
    btn.disabled = false;
    if (error && isRateLimit(error)) return setError(COPY.rateLimited);
    if (error) return setError(COPY.failed);
    lastEmail = email;
    $('#sent-email').textContent = email;
    $('#sent-feedback').textContent = '';
    setNotice('');
    show('sent');
    startCooldown();
  });

  function startCooldown() {
    const btn = $('[data-action="resend"]');
    let left = RESEND_COOLDOWN_S;
    btn.disabled = true;
    clearInterval(cooldownTimer);
    const tick = () => {
      btn.textContent = left > 0 ? `Send it again (${left}s)` : 'Send it again';
      if (left-- <= 0) { btn.disabled = false; clearInterval(cooldownTimer); }
    };
    tick();
    cooldownTimer = setInterval(tick, 1000);
  }

  $('[data-action="resend"]').addEventListener('click', async () => {
    const { error } = await sendLink(lastEmail);
    $('#sent-feedback').textContent = error ? (isRateLimit(error) ? COPY.rateLimited : COPY.failed) : COPY.resent;
    startCooldown();
  });
  $('[data-action="change-email"]').addEventListener('click', () => {
    input.value = lastEmail;
    show('signin');
    input.focus();
    input.select();
  });

  $$('[data-action="sign-out"]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (sb) await sb.auth.signOut();
      input.value = '';
      setError('');
      show('signin');
    })
  );

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const productLabel = (key) => {
    if (key === 'launch-light') return 'Launch Light';
    if (key === 'lift-light') return 'Lift Light';
    return key;
  };

  const firstName = (fullName) => (fullName || '').trim().split(/\s+/)[0] || 'You';

  async function fetchGuides() {
    if (DEMO) {
      await new Promise((r) => setTimeout(r, 700));
      if (params.get('demo') === 'empty') return [];
      const url = 'https://productionblynk.github.io/magnella-guides-beta/28dc1817-45f9-43eb-ad70-124c66b15d31.html';
      return [
        { created_at: '2026-10-12', product: 'Lift Light', recipient_first_name: 'Shonna', guide_url: url },
        { created_at: '2026-09-03', product: 'Launch Light', recipient_first_name: 'Kyla', guide_url: url },
        { created_at: '2026-06-18', product: 'Lift Light', recipient_first_name: 'Jennifer', guide_url: url },
      ];
    }
    // Real query: pull delivered reports for signed-in user (RLS filters by email).
    const { data, error } = await sb
      .from('reports')
      .select('id, product, created_at, delivered_at, validation_status, intakes!inner(legal_name)')
      .eq('validation_status', 'pass')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      created_at: row.delivered_at || row.created_at,
      product: productLabel(row.product),
      recipient_first_name: firstName(row.intakes?.legal_name),
      guide_url: GUIDE_URL_TEMPLATE.replace('{id}', row.id),
    }));
  }

  function renderGuides(rows) {
    const list = $('#guides-list');
    const tpl = $('#guide-row');
    list.replaceChildren();
    rows.forEach((g) => {
      const li = tpl.content.firstElementChild.cloneNode(true);
      li.querySelector('.mg-guide__product').textContent = g.product;
      const title = li.querySelector('.mg-guide__title');
      if (SHOW_RECIPIENT) {
        title.textContent = `For ${g.recipient_first_name}`;
      } else {
        title.textContent = fmtDate(g.created_at);
      }
      li.querySelector('.mg-guide__date').textContent = SHOW_RECIPIENT ? `Created ${fmtDate(g.created_at)}` : '';
      li.querySelector('.mg-guide__label').textContent = SHOW_RECIPIENT
        ? `View ${g.recipient_first_name}'s guide`
        : 'View your guide';
      li.querySelector('a').href = g.guide_url;
      list.appendChild(li);
    });
  }

  async function enterAccount(email) {
    $('#account-email').textContent = email;
    ['#guides-list', '#guides-empty', '#guides-missing', '#guides-error'].forEach((s) => ($(s).hidden = true));
    $('#guides-loading').hidden = false;
    show('account');
    try {
      const rows = await fetchGuides();
      $('#guides-loading').hidden = true;
      if (!rows.length) return ($('#guides-empty').hidden = false);
      renderGuides(rows);
      $('#guides-list').hidden = false;
      $('#guides-missing').hidden = false;
    } catch (e) {
      console.error('fetchGuides failed:', e);
      $('#guides-loading').hidden = true;
      $('#guides-error').hidden = false;
    }
  }

  async function init() {
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.get('error_code') === 'otp_expired' || /expired/i.test(hash.get('error_description') || '')) {
      setNotice(COPY.expired);
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (DEMO) {
      if (params.has('signed-in')) return enterAccount('jennifer.r@gmail.com');
      return show('signin');
    }
    const { data } = await sb.auth.getSession();
    if (data.session) return enterAccount(data.session.user.email);
    show('signin');
    sb.auth.onAuthStateChange((evt, session) => {
      if (evt === 'SIGNED_IN' && session) enterAccount(session.user.email);
    });
  }

  init();
})();

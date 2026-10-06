/* ============================================================================
   CONSENT + POLICIES — identical in raw/web and raw/mobile.

   Two jobs, both additive: the page is complete and readable without this
   file, and with it off there is no analytics to consent to.

   1. The consent bar. Shown on the first visit, and again whenever
      CONSENT_VERSION is bumped (do that when the cookie policy changes in a
      way people should re-decide on). The choice lives in localStorage only.
      Analytics is NOT loaded before an explicit "Aceitar" — not loaded
      in a denied state, not loaded at all — which is the strictest reading
      of the LGPD and needs no Consent Mode.

   2. The two policy dialogs. The footer links are fragment links to them;
      this turns a click into showModal(), and opens one on load when the URL
      carries its fragment, so a policy can be linked to directly.
   ========================================================================= */

(() => {
  "use strict";

  /* The GA4 measurement id, "G-XXXXXXXXXX". Empty means analytics is off:
     the bar still asks and records the answer, but nothing is loaded. */
  const GA_MEASUREMENT_ID = "G-N6PG98GN9R";

  const STORAGE_KEY = "consent";
  const CONSENT_VERSION = 1;

  /* ---- 1 · Stored choice --------------------------------------------------
     Every access is guarded: storage throws in some private modes and when
     site data is blocked. A failed read shows the bar; a failed write just
     means it is asked again next time. Neither loads anything. */
  function readChoice() {
    try {
      const record = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (record && record.v === CONSENT_VERSION && typeof record.analytics === "boolean") {
        return record;
      }
    } catch {
      /* unreadable or malformed — treat as no choice */
    }
    return null;
  }

  function writeChoice(analytics) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: CONSENT_VERSION, analytics, at: new Date().toISOString() }),
      );
    } catch {
      /* storage unavailable — the choice holds for this page view only */
    }
  }

  /* ---- 2 · Analytics ------------------------------------------------------ */
  let analyticsLoaded = false;

  function loadAnalytics() {
    if (analyticsLoaded || !GA_MEASUREMENT_ID) return;
    analyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  /* GA sets its cookies on the widest domain it is allowed to, which is not
     knowable from here without a public-suffix list. So expire each name on
     every suffix of the hostname; the ones that were never valid domains are
     ignored by the browser. */
  function clearAnalyticsCookies() {
    const names = document.cookie
      .split(";")
      .map((pair) => pair.split("=")[0].trim())
      .filter((name) => name.startsWith("_ga") || name === "_gid");
    const parts = location.hostname.split(".");

    for (const name of names) {
      document.cookie = name + "=; Max-Age=0; path=/";
      for (let i = 0; i < parts.length; i++) {
        document.cookie = name + "=; Max-Age=0; path=/; domain=." + parts.slice(i).join(".");
      }
    }
  }

  /* ---- 3 · The bar -------------------------------------------------------- */
  const bar = document.querySelector(".consent");
  let decided = false;

  function showBar() {
    if (!bar) return;
    bar.hidden = false;
  }

  if (bar) {
    bar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-consent]");
      if (!button) return;

      const accepted = button.dataset.consent === "accept";
      decided = true;
      writeChoice(accepted);
      bar.hidden = true;

      if (accepted) {
        loadAnalytics();
        return;
      }
      // Refusing after accepting: drop what GA left behind. If gtag is
      // already running in this page, only a reload takes it out of memory.
      clearAnalyticsCookies();
      if (analyticsLoaded) location.reload();
    });
  }

  /* Not on arrival: the first ten seconds belong to the page. Only the first
     visit waits — "Alterar preferências" below shows the bar at once. */
  const FIRST_VISIT_DELAY = 10000;

  const choice = readChoice();
  // Someone can reach the bar through the cookie policy before the delay
  // runs out; once they have answered, the timer must not ask again.
  if (!choice) {
    setTimeout(() => {
      if (!decided) showBar();
    }, FIRST_VISIT_DELAY);
  }
  else if (choice.analytics) loadAnalytics();

  /* ---- 4 · Policy dialogs -------------------------------------------------
     Esc, the focus trap and returning focus to the link afterwards all come
     with showModal(). A browser without it keeps the plain fragment links. */
  const policies = document.querySelectorAll(".policy-modal");
  if (!policies.length || typeof policies[0].showModal !== "function") return;

  function openPolicy(id) {
    const dialog = document.getElementById(id);
    if (!dialog || !dialog.classList.contains("policy-modal")) return false;
    // One at a time: the privacy text links to the cookie text and back.
    policies.forEach((other) => {
      if (other !== dialog && other.open) other.close();
    });
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".policy-modal__body").scrollTop = 0;
    return true;
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#politica-"]');
    if (link && openPolicy(link.getAttribute("href").slice(1))) event.preventDefault();
  });

  policies.forEach((dialog) => {
    // The close control is a link to the footer, which is what it does with
    // scripting off; here it just closes.
    dialog.querySelector(".policy-modal__close").addEventListener("click", (event) => {
      event.preventDefault();
      dialog.close();
    });

    // The backdrop is not a child, so a click on it targets the <dialog>.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    // Opened from a direct link: drop the fragment on close, or a reload
    // would open it again.
    dialog.addEventListener("close", () => {
      if (location.hash === "#" + dialog.id) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    });
  });

  // Revoking has to be as easy as consenting, and this is where it lives.
  const reopen = document.querySelector("[data-consent-reopen]");
  if (reopen && bar) {
    reopen.hidden = false;
    reopen.addEventListener("click", () => {
      reopen.closest("dialog").close();
      showBar();
      bar.querySelector("[data-consent]").focus();
    });
  }

  if (location.hash.startsWith("#politica-")) openPolicy(location.hash.slice(1));
})();

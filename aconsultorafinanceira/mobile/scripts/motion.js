/* ============================================================================
   MOTION — mobile.

   Ported from raw/mobile/scripts/motion.js (panels, testimonial carousel) and
   raw/mobile/scripts/consent.js (the policy dialog). No analytics: this page
   loads nothing third-party.

   Contract, carried over: the page is complete and readable without this
   file — every string it touches is already in the HTML. It is deferred, and
   under prefers-reduced-motion it wires behaviour, never decoration.
   ========================================================================= */
(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1 · Closing a panel ---------------------------------------------
     A <details> hides its content the instant `open` goes, so motion.css can
     only animate a panel that is still open. This holds `open` for the
     length of the collapse — `--close-hold`, declared in motion.css beside
     the keyframes — marks the panel `.is-closing`, and takes `open` away
     afterwards. Zero means "do not intervene": no script, reduced motion or
     an engine without the rules all close natively. */
  const PANELS = ["details.faq__item", "details.menu"].join(", ");

  const state = new WeakMap();

  document.querySelectorAll(PANELS).forEach((item) => {
    const summary = item.querySelector(":scope > summary");
    if (summary) summary.addEventListener("click", onSummaryClick);
  });

  function onSummaryClick(event) {
    const item = event.currentTarget.parentElement;

    // Clicked again mid-collapse: finish the close now so the default action
    // reopens it.
    if (state.has(item)) {
      settle(item);
      return;
    }

    if (item.open) {
      const ms = hold(item);
      if (!ms) return;

      event.preventDefault();
      collapse(item, ms);
      return;
    }

    // Opening. Where <details> share a `name` the browser closes the open one
    // instantly, so that closure is taken over here too.
    const sibling = openSibling(item);
    if (!sibling) return;

    const ms = hold(sibling);
    if (!ms) return;

    event.preventDefault();
    collapse(sibling, ms);
    item.open = true;
  }

  function hold(item) {
    const declared = getComputedStyle(item)
      .getPropertyValue("--close-hold")
      .trim();
    const time = /^([\d.]+)(m?s)$/.exec(declared);

    return time ? Number(time[1]) * (time[2] === "s" ? 1000 : 1) : 0;
  }

  function collapse(item, ms) {
    // Leave the exclusive group for the length of the close; the attribute
    // goes back the moment the panel is actually closed.
    const name = item.getAttribute("name");
    if (name !== null) item.removeAttribute("name");

    item.classList.add("is-closing");
    state.set(item, { name, timer: setTimeout(() => settle(item), ms) });
  }

  function settle(item) {
    const held = state.get(item);
    if (!held) return;

    clearTimeout(held.timer);
    state.delete(item);

    item.classList.remove("is-closing");
    item.open = false;

    if (held.name !== null) item.setAttribute("name", held.name);
  }

  function openSibling(item) {
    const name = item.getAttribute("name");
    if (!name) return null;

    return (
      [...document.querySelectorAll("details[open]")].find(
        (other) => other !== item && other.getAttribute("name") === name,
      ) || null
    );
  }

  /* ---- 2 · Testimonial -------------------------------------------------
     raw/mobile's carousel. Every quote is in the HTML and a radio decides
     which shows, so this advances by CHECKING the next radio and lets the
     stylesheet do the rest. 7s per story, a resumable clock, paused while
     the story being read is held (hover, or a click on it), restarted when
     someone picks a story by hand. */
  const depoimento = document.querySelector(".depoimento");
  const picks = [...document.querySelectorAll(".depoimento__pick")];

  if (depoimento && picks.length > 1) {
    const INTERVAL = 7000;
    let timer = null;
    let startedAt = 0;
    let remaining = INTERVAL;

    const stopped = reduced;

    const current = () => picks.findIndex((p) => p.checked);

    // Set while the carousel itself moves the radio, so the `change`
    // listener can tell its own advance from a human pick.
    let programmatic = false;

    const show = (i) => {
      const next = picks[i];
      if (!next || next.checked) return;
      programmatic = true;
      next.checked = true;
      next.dispatchEvent(new Event("change", { bubbles: true }));
      programmatic = false;
    };

    const advance = () => show((current() + 1) % picks.length);

    /* `held` is the single source of truth for "paused"; the countdown bar
       reads it through [data-held]. `over` is a resting mouse or pen; `pin`
       is what a click last decided, and outranks it. */
    const list = document.querySelector(".depoimento__people");
    const RELEASED = Symbol("released");
    let over = null;
    let pin = null;

    const rowAt = (target) => target?.closest?.(".depoimento__people li") ?? null;
    const activeRow = () => (list ? list.children[current()] : null) ?? null;
    const held = () => {
      const row = activeRow();
      if (row === null) return false;
      if (pin === RELEASED) return false;
      if (pin !== null) return pin === row;
      return over === row;
    };

    const run = (delay) => {
      startedAt = performance.now();
      timer = setTimeout(() => {
        timer = null;
        advance();
        remaining = INTERVAL;
        sync();
      }, delay);
    };

    const pause = () => {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
    };

    const resume = () => {
      if (stopped || timer || held()) return;
      run(remaining);
    };

    function sync() {
      if (held()) {
        depoimento.dataset.held = "";
        pause();
      } else {
        delete depoimento.dataset.held;
        resume();
      }
    }

    const start = () => {
      if (stopped) return;
      remaining = INTERVAL;
      depoimento.dataset.rotating = "";
      sync();
    };

    picks.forEach((pick) => {
      pick.addEventListener("change", () => {
        if (programmatic) return;
        pause();
        start();

        // Only on a pick: the carousel turning by itself never moves the page.
        depoimento.scrollIntoView({
          block: "start",
          behavior: reduced ? "auto" : "smooth",
        });
      });
    });

    if (list) {
      list.addEventListener("pointerover", (e) => {
        if (e.pointerType === "touch") return;
        over = rowAt(e.target);
        sync();
      });

      list.addEventListener("pointerout", (e) => {
        if (e.pointerType === "touch") return;
        const row = rowAt(e.target);
        if (row && !row.contains(e.relatedTarget)) {
          over = rowAt(e.relatedTarget);
          if (over === null) pin = null;
          sync();
        }
      });

      document.addEventListener("pointerdown", (e) => {
        const row = rowAt(e.target);
        if (row === null) pin = null;
        else if (row !== activeRow()) pin = RELEASED;
        else pin = held() ? RELEASED : row;
        sync();
      });
    }

    // The observer decides only WHEN the clock begins, then disconnects.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            start();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(depoimento);
    } else {
      start();
    }

    document.documentElement.style.setProperty(
      "--testimonial-interval",
      `${INTERVAL}ms`,
    );
  }

  /* ---- 3 · Policy dialog -----------------------------------------------
     The footer link is a fragment link; this turns a click into showModal()
     and opens the dialog on load when the URL carries its fragment. Esc, the
     focus trap and returning focus come with showModal(); a browser without
     it keeps the plain link. */
  const policies = document.querySelectorAll(".policy-modal");
  if (!policies.length || typeof policies[0].showModal !== "function") return;

  function openPolicy(id) {
    const dialog = document.getElementById(id);
    if (!dialog || !dialog.classList.contains("policy-modal")) return false;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".policy-modal__body").scrollTop = 0;
    return true;
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#politica-"]');
    if (link && openPolicy(link.getAttribute("href").slice(1))) event.preventDefault();
  });

  policies.forEach((dialog) => {
    dialog.querySelector(".policy-modal__close").addEventListener("click", (event) => {
      event.preventDefault();
      dialog.close();
    });

    // The backdrop is not a child, so a click on it targets the <dialog>.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    // Opened from a direct link: drop the fragment on close.
    dialog.addEventListener("close", () => {
      if (location.hash === "#" + dialog.id) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    });
  });

  if (location.hash.startsWith("#politica-")) openPolicy(location.hash.slice(1));
})();

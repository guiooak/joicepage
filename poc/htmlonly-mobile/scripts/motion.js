/* ============================================================================
   MOTION — mobile.

   Contract, carried over from poc/rawhtml and load bearing here too:
     · The page is complete and readable without this file. Every string it
       touches is already in the HTML; nothing here creates content. The nav
       drawer, the FAQ and the Serviços carousel are all native elements that
       work with scripting off.
     · It is deferred, so it never blocks the first paint.
     · Under prefers-reduced-motion it wires behaviour, never decoration.

   Almost everything on this page is CSS. Only three things genuinely need
   script — splitting the headline into words, counting the numerals up from
   a figure that has to stay in the HTML, and holding a panel open long
   enough for the stylesheet to animate it closed. All three are ports of the
   desktop build.
   ========================================================================= */
(() => {
  "use strict";

  // Marks that scripting is available, so motion.css can add affordances that
  // would otherwise lie about what the page can do.
  document.documentElement.classList.add("js");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1 · Text scroll -------------------------------------------------
     Wraps each word of the Visão headline so motion.css can stagger the
     ink-in across the block. The reveal itself is a CSS scroll timeline;
     nothing here runs on scroll.

     Text is only ever re-parented, never rewritten: the words that come out
     are the words that went in, and the <em> carrying the drawn two-tone
     split keeps its children. Collapsing whitespace would change the copy,
     so the split keeps its separators and re-inserts them verbatim. */
  const headline = document.querySelector(".visao__title");

  if (headline) {
    const words = [];

    const wrap = (node) => {
      // Walk a copy: the loop reparents nodes as it goes.
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          wrap(child);
          return;
        }
        if (child.nodeType !== Node.TEXT_NODE) return;

        const parts = child.textContent.split(/(\s+)/);
        if (parts.length === 1 && !parts[0].trim()) return;

        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (!part.trim()) {
            frag.append(part); // whitespace stays as-is
            return;
          }
          const span = document.createElement("span");
          span.className = "word";
          span.textContent = part;
          words.push(span);
          frag.append(span);
        });
        child.replaceWith(frag);
      });
    };

    wrap(headline);

    // Indices drive the stagger; the total keeps the range proportional
    // however long the headline gets.
    words.forEach((span, i) => {
      span.style.setProperty("--i", i);
      span.style.setProperty("--n", words.length);
    });
  }

  /* ---- 2 · Counter -----------------------------------------------------
     Reads the figure already rendered in the HTML, counts up to it, then
     writes the original string back verbatim — so "+130", "100%" and "+06"
     keep their prefixes, suffixes and zero padding without being re-encoded
     anywhere. If anything is unparseable it is left alone.

     The figures must stay in the markup: a CSS counter would move "+130" out
     of the document text and out of the crawlable response, which is the one
     thing this build exists to avoid. */
  const numerals = document.querySelectorAll(".numeros dt");

  if (numerals.length && !reduced && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          countUp(entry.target);
        });
      },
      { threshold: 0.6 },
    );

    numerals.forEach((n) => observer.observe(n));
  }

  function countUp(el) {
    const original = el.textContent;
    const match = original.match(/\d+/);
    if (!match) return;

    const target = Number(match[0]);
    const digits = match[0].length; // preserves the "06" padding
    const duration = 900;
    const start = performance.now();

    // Hold the box at its final width so the row does not reflow while the
    // digits change.
    //
    // `offsetWidth`, NOT getBoundingClientRect(): the page scales its whole
    // canvas with `zoom`, and the rect comes back in zoomed pixels while a
    // CSS length is read unzoomed. Writing one into the other inflated the
    // box by the zoom factor — 328 became 355.34 at 390 and 391.78 at 430 —
    // so the numeral sat off centre for the length of the count and snapped
    // back when the count cleared the property. offsetWidth is unaffected by
    // zoom and reports the drawn 328 at every width.
    el.style.minInlineSize = `${el.offsetWidth}px`;

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast start, long settle.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const value = Math.round(target * eased);

      el.textContent = original.replace(
        match[0],
        String(value).padStart(digits, "0"),
      );

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = original; // exact original string, always
        el.style.minInlineSize = "";
      }
    };

    el.textContent = original.replace(match[0], "0".padStart(digits, "0"));
    requestAnimationFrame(frame);
  }

  /* ---- 3 · Closing a panel ---------------------------------------------
     Every collapse on the page animates open and animates closed: the nav
     drawer, the Processo accordion and the FAQ. This is the closed half.

     A <details> hides its content the instant `open` goes, so the browser
     gives the opening half of every collapse away for free and makes the
     closing half impossible: styles/motion.css can only ever animate a panel
     that is still open. That is a hard constraint over there, written out
     beside the rules, because a forced-closed resting state is what once made
     panel content unreachable on one Chrome version.

     All this does is hold `open` for the length of the collapse. It marks the
     panel `.is-closing`, lets the stylesheet run its outgoing keyframes
     against a panel the browser still considers open, and takes `open` away
     once they have finished. No geometry is measured and no style is written
     from here — every value stays in the stylesheet, and this file keeps to
     timing.

     Nothing about the page depends on it. With scripting off, under
     prefers-reduced-motion, or on an engine that animates none of this, the
     panels close instantly — which is exactly the behaviour that shipped
     before, and it is reached by doing less rather than through a fallback
     path. The last two cases arrive the same way as the first: the
     stylesheet stops declaring a duration, so this stops intervening. */
  const PANELS = [
    "details.accordion__item",
    "details.faq__item",
    "details.menu",
  ].join(", ");

  // Panel → the `name` taken off it for the duration (or null) and the timer
  // that will put it back. Its presence is also the "already closing" flag.
  const state = new WeakMap();

  document.querySelectorAll(PANELS).forEach((item) => {
    const summary = item.querySelector(":scope > summary");
    if (summary) summary.addEventListener("click", onSummaryClick);
  });

  function onSummaryClick(event) {
    const item = event.currentTarget.parentElement;

    // Clicked again mid-collapse. Finish the close now, synchronously, so the
    // default action that follows this listener sees a closed <details> and
    // reopens it — rather than swallowing the click for the rest of the
    // animation.
    if (state.has(item)) {
      settle(item);
      return;
    }

    if (item.open) {
      const ms = hold(item);
      if (!ms) return; // nothing to animate; let it close natively

      event.preventDefault();
      collapse(item, ms);
      return;
    }

    // Opening. Where <details> share a `name` the browser closes the open one
    // itself, instantly, the moment this one opens — so that closure has to
    // be taken over here too, or half the interaction still snaps.
    const sibling = openSibling(item);
    if (!sibling) return; // nothing to rescue; let it open natively

    const ms = hold(sibling);
    if (!ms) return;

    event.preventDefault();
    collapse(sibling, ms);
    item.open = true;
  }

  /* How long to hold this panel open, in milliseconds, straight off
     `--close-hold` — which styles/motion.css declares beside the keyframes it
     belongs to.

     A duration is the one thing this file cannot work out for itself. Chrome
     reports NOTHING for an animation on `::details-content`: it runs and it
     paints, but there is no `getAnimations()` entry and no `animationstart` /
     `animationend`, on the <details> or on the document. Both were tried on
     152 before this. So the number comes from the stylesheet that owns it,
     and zero — the resting value, and what every engine and every motion
     preference the rules do not cover gets — means "do not intervene".

     Read per click rather than cached, so a change of motion preference
     takes effect without a reload, and so the drawer's shorter hold comes
     off the drawer rather than out of a table in here. */
  function hold(item) {
    const declared = getComputedStyle(item)
      .getPropertyValue("--close-hold")
      .trim();
    const time = /^([\d.]+)(m?s)$/.exec(declared);

    return time ? Number(time[1]) * (time[2] === "s" ? 1000 : 1) : 0;
  }

  function collapse(item, ms) {
    // Leave the exclusive group for the length of the close, so opening a
    // neighbour does not slam this one shut under its own animation. The
    // attribute goes back the moment the panel is actually closed: it is the
    // only thing making one-at-a-time work with scripting off, and it must
    // never be missing while the page is at rest.
    const name = item.getAttribute("name");
    if (name !== null) item.removeAttribute("name");

    item.classList.add("is-closing");
    state.set(item, { name, timer: setTimeout(() => settle(item), ms) });
  }

  function settle(item) {
    const held = state.get(item);
    if (!held) return;

    // An interrupted close leaves its timer pending, and the panel may well
    // be closing again by the time it fires. Clearing it stops that stale
    // timer cutting the second collapse short.
    clearTimeout(held.timer);
    state.delete(item);

    item.classList.remove("is-closing");
    item.open = false;

    // After `open` goes, never before: handing a still-open panel back to its
    // group invites the browser to enforce exclusivity against whichever
    // neighbour was just opened.
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
})();

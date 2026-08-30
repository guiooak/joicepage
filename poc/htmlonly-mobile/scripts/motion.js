/* ============================================================================
   MOTION — mobile.

   Contract, carried over from poc/rawhtml and load bearing here too:
     · The page is complete and readable without this file. Every string it
       touches is already in the HTML; nothing here creates content. The nav
       drawer, the FAQ and the Serviços carousel are all native elements that
       work with scripting off.
     · It is deferred, so it never blocks the first paint.
     · Under prefers-reduced-motion it wires behaviour, never decoration.

   Almost everything on this page is CSS. Only two things genuinely need
   script — splitting the headline into words, and counting the numerals up
   from a figure that has to stay in the HTML. Both are ports of the desktop
   build's sections 1 and 5.
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
})();

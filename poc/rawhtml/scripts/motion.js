/* ============================================================================
   MOTION — the two behaviours that genuinely need script, plus the counter.

   Contract for this file, which the build depends on:
     · The page is complete and readable without it. Every string it touches
       is already in the HTML; nothing here creates content.
     · It is deferred, so it never blocks the first paint.
     · It does nothing at all under prefers-reduced-motion beyond wiring the
       click behaviour, which is function rather than decoration.

   Text scroll, stack and parallax are CSS — see styles/motion.css.
   ========================================================================= */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Marks that scripting is available, so motion.css can add affordances
  // (pointer cursors, hover states) that would lie without it.
  document.documentElement.classList.add("js");

  /* ---- 1 · Text scroll -------------------------------------------------
     ref: reveal-text-on-scroll.framer.website
     Wraps each word of the Visão headline so styles/motion.css can stagger
     the ink-in across the block. The reveal itself is a CSS scroll timeline;
     nothing here runs on scroll.

     Text is only ever re-parented, never rewritten: the words that come out
     are the words that went in, and the <em> that carries the drawn two-tone
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

    // Indices drive the stagger; the total lets the range stay proportional
    // however long the headline gets.
    words.forEach((span, i) => {
      span.style.setProperty("--i", i);
      span.style.setProperty("--n", words.length);
    });
  }

  /* ---- 2 · Serviços cards ---------------------------------------------
     ref: biggest-delivers-516518.framer.app
     Only moves the [data-open] attribute; the 899/437 transition is CSS, and
     so is the hover preview — the reference opens its panels under the
     pointer, and that needs no script at all. */
  const grid = document.querySelector(".servicos__grid");
  if (grid) {
    const cards = [...grid.querySelectorAll(".service-card")];

    cards.forEach((card, i) => {
      const title = card.querySelector(".service-card__title");
      const label = title ? title.textContent.replace(/\s+/g, " ").trim() : `Serviço ${i + 1}`;

      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Ver detalhes: ${label}`);
      card.setAttribute("aria-expanded", String(card.hasAttribute("data-open")));

      const open = () => {
        if (card.hasAttribute("data-open")) return;
        cards.forEach((c) => {
          c.removeAttribute("data-open");
          c.setAttribute("aria-expanded", "false");
        });
        card.setAttribute("data-open", "");
        card.setAttribute("aria-expanded", "true");
      };

      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  /* ---- 3 · Testimonial -------------------------------------------------
     ref: minimal-testimonials.framer.website

     Only the people carrying data-quote are selectable. Three of the five
     are real; the other two are placeholders in the design itself, so there
     is nothing to switch to and this refuses to invent it.

     The reference advances on its own rather than waiting to be clicked, so
     this does too — with the countdown drawn in CSS, paused on hover and
     focus, and stopped for good the moment someone picks an entry by hand.
     Auto-advance that fights the reader is worse than none. */
  const quote = document.querySelector(".depoimento__quote");
  const people = document.querySelectorAll(".depoimento__people li");
  const selectable = [...people].filter((p) => p.hasAttribute("data-quote"));

  if (quote && selectable.length) {
    const INTERVAL = 7000;
    let timer = null;
    let stopped = reduced || selectable.length < 2;

    const show = (person) => {
      if (person.getAttribute("aria-current") === "true") return;
      people.forEach((p) => p.removeAttribute("aria-current"));
      person.setAttribute("aria-current", "true");

      const next = person.getAttribute("data-quote");
      if (reduced) {
        quote.textContent = next;
        return;
      }
      quote.setAttribute("data-swapping", "");
      setTimeout(() => {
        quote.textContent = next;
        quote.removeAttribute("data-swapping");
      }, 220);
    };

    const advance = () => {
      const i = selectable.findIndex(
        (p) => p.getAttribute("aria-current") === "true"
      );
      show(selectable[(i + 1) % selectable.length]);
    };

    /* Starts once the section has been seen, then runs for the life of the
       page. It used to pause whenever the block left the viewport, which made
       the rotation feel conditional on scroll position — leave and come back
       and it had frozen. The observer now only decides WHEN it begins.

       A chained timeout rather than an interval, because the clock has to be
       resumable: hovering the current entry pauses it mid-count, and the CSS
       progress bar pauses in place at the same moment. Restarting the timer
       from zero on resume would put the two out of step — the bar would carry
       on from 40% while the timer counted a fresh 7s. Tracking the remaining
       time keeps them together. */
    let startedAt = 0;
    let remaining = INTERVAL;

    const run = (delay) => {
      startedAt = performance.now();
      timer = setTimeout(() => {
        timer = null;
        advance();
        remaining = INTERVAL;
        run(INTERVAL);
      }, delay);
    };

    const start = () => {
      if (stopped || timer) return;
      remaining = INTERVAL;
      run(remaining);
    };

    const pause = () => {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
    };

    const resume = () => {
      if (stopped || timer) return;
      run(remaining);
    };

    selectable.forEach((person) => {
      person.setAttribute("role", "button");
      person.setAttribute("tabindex", "0");

      /* Picking an entry jumps to it and restarts the clock, rather than
         ending the rotation as it used to. Restarting matters: without it a
         click could land a fraction of a second before the next tick and be
         swept away immediately. */
      const pick = () => {
        show(person);
        pause();
        start();
      };

      person.addEventListener("click", pick);
      person.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick();
        }
      });
    });

    /* Hovering the entry that is currently showing holds the clock, so
       someone part way through the quote is not moved on. Only that entry —
       hovering the others keeps it running, since they are a control rather
       than the thing being read.

       Delegated, because which element counts changes as the rotation moves.
       The `relatedTarget` check keeps a move between a row's own children
       from registering as a leave. */
    const list = document.querySelector(".depoimento__people");

    if (list) {
      list.addEventListener("pointerover", (e) => {
        if (e.pointerType === "touch") return;
        if (e.target.closest('li[aria-current="true"]')) pause();
      });

      list.addEventListener("pointerout", (e) => {
        if (e.pointerType === "touch") return;
        const row = e.target.closest('li[aria-current="true"]');
        if (row && !row.contains(e.relatedTarget)) resume();
      });
    }

    // The observer only decides when to begin; it disconnects immediately
    // after, so nothing can pause the rotation later.
    const block = document.querySelector(".depoimento");
    if ("IntersectionObserver" in window && block) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            start();
          }
        },
        { threshold: 0.25 }
      );
      io.observe(block);
    } else {
      start();
    }

    document.documentElement.style.setProperty(
      "--testimonial-interval",
      `${INTERVAL}ms`
    );
  }

  /* ---- 8 · CTA pills follow away from the cursor -----------------------
     The drift is CSS; this only adds the push. It writes `transform`, which
     composes with the `translate` the drift animates rather than fighting it
     — see the note in styles/motion.css.

     Everything is computed in the CTA's own coordinate space, not the
     viewport's. The page is scaled by a `zoom` on body at widths under
     1440, so viewport pixels and the element's own pixels are not the same
     unit; mixing them would make the push strength drift with window size.
     `offsetLeft`/`offsetTop` are already unzoomed, and the ratio between the
     block's rendered and offset width recovers the factor for the pointer.

     Positions are read from `offsetLeft`, which ignores transforms. Reading
     `getBoundingClientRect()` instead would measure the pill where the push
     has already put it and feed its own output back in, which oscillates. */
  const cta = document.querySelector(".conversa");

  if (cta && !reduced) {
    const pills = [...cta.querySelectorAll(".tag")];
    const RADIUS = 200; // how close the cursor has to get, in CTA pixels
    const STRENGTH = 30; // furthest a pill is pushed
    let frame = null;
    let pointer = null;

    const render = () => {
      frame = null;
      const box = cta.getBoundingClientRect();
      // zoom factor: rendered width against the element's own width
      const scale = cta.offsetWidth ? box.width / cta.offsetWidth : 1;

      pills.forEach((pill) => {
        if (!pointer) {
          pill.style.transform = "";
          return;
        }

        const cx = pill.offsetLeft + pill.offsetWidth / 2;
        const cy = pill.offsetTop + pill.offsetHeight / 2;
        const dx = cx - (pointer.x - box.left) / scale;
        const dy = cy - (pointer.y - box.top) / scale;
        const dist = Math.hypot(dx, dy);

        if (dist > RADIUS || dist === 0) {
          pill.style.transform = "";
          return;
        }

        // Squared falloff: nothing happens until the cursor is genuinely
        // near, then the pill moves decisively.
        const force = (1 - dist / RADIUS) ** 2;
        const step = (STRENGTH * force) / dist;
        pill.style.transform =
          `translate(${(dx * step).toFixed(2)}px, ${(dy * step).toFixed(2)}px)`;
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    cta.addEventListener("pointermove", (e) => {
      // Coarse pointers have no hover to track; a tap should not fling them.
      if (e.pointerType === "touch") return;
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    });

    cta.addEventListener("pointerleave", () => {
      pointer = null;
      schedule();
    });
  }

  /* ---- 5 · Counter -----------------------------------------------------
     ref: final-intend-665098.framer.app
     Reads the figure already rendered in the HTML, counts up to it, then
     writes the original string back verbatim — so "+130", "100%" and "+06"
     keep their prefixes, suffixes and zero padding without being re-encoded
     anywhere. If anything is unparseable it is simply left alone. */
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
      { threshold: 0.6 }
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

    // Hold the box at its final width so the row does not reflow while
    // the digits change.
    el.style.minInlineSize = `${el.getBoundingClientRect().width}px`;

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast start, long settle, matching the reference.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const value = Math.round(target * eased);

      el.textContent = original.replace(
        match[0],
        String(value).padStart(digits, "0")
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

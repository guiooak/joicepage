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

  /* ---- 2 · Serviços cards ---------------------------------------------
     ref: biggest-delivers-516518.framer.app
     Only moves the [data-open] attribute; the 899/437 transition is CSS. */
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
     Only the people carrying data-quote are selectable. The mockup ships one
     real testimonial; the other four names are placeholders in the design
     itself, so there is nothing to switch to and this refuses to invent it. */
  const quote = document.querySelector(".depoimento__quote");
  const people = document.querySelectorAll(".depoimento__people li");

  if (quote && people.length) {
    people.forEach((person) => {
      if (!person.hasAttribute("data-quote")) return;

      person.setAttribute("role", "button");
      person.setAttribute("tabindex", "0");

      const select = () => {
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

      person.addEventListener("click", select);
      person.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });
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

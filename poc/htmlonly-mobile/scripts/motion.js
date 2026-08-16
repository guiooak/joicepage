/* ============================================================================
   MOTION — mobile.

   Contract, carried over from poc/rawhtml and load bearing here too:
     · The page is complete and readable without this file. Every string it
       touches is already in the HTML; nothing here creates content. The nav
       drawer, the FAQ and the Serviços carousel are all native elements that
       work with scripting off.
     · It is deferred, so it never blocks the first paint.
     · Under prefers-reduced-motion it wires behaviour, never decoration.
   ========================================================================= */
(() => {
  "use strict";

  // Marks that scripting is available, so motion.css can add affordances that
  // would otherwise lie about what the page can do.
  document.documentElement.classList.add("js");
})();

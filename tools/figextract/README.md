# figextract

Decodes a Figma `.fig` export into JSON, so the design can be read exactly
without needing edit access to the file on figma.com.

```sh
python3 figkiwi.py "/path/to/Joice Sperandio.fig" canvas.json   # ~52MB
python3 extract.py 1        # top-level sections
python3 extract.py 99       # full tree
python3 extract.py 99 "MOBILE 360px"   # a different root frame
python3 extract.py 99 392:8099         # …or the same one by guid
```

Nodes the designer switched off are tagged `HIDDEN`, so a dump never describes
a page nobody sees.

Requires Python 3.14+ (uses stdlib `compression.zstd`).

## Format notes

A `.fig` is a ZIP holding `canvas.fig`, `meta.json`, `thumbnail.png` and an
`images/` directory with every bitmap in the file (265 of them here).

`canvas.fig` is a `fig-kiwi` container: an 8-byte magic, a `uint32` version
(106 here), then length-prefixed chunks. Chunk 0 is the Kiwi schema — 629
definitions, self-describing, so no external schema is needed. Chunk 1 is the
document, decoded as the schema's `Message` type.

Two things cost time getting here, both worth knowing:

- **Chunk compression is mixed.** The schema chunk is raw deflate; the document
  chunk is **zstd** (magic `28 b5 2f fd`). Older `.fig` files deflate both. A
  decoder that only tries deflate silently yields garbage rather than failing.
- **Kiwi's 64-bit varints are not plain LEB128.** They carry eight 7-bit
  groups, then a ninth byte contributing a full 8 bits at shift 56. Treating
  them as ordinary varints desynchronises the whole stream.

Decoding is verified by the byte count: the document chunk consumes
10,287,412 of 10,287,412 bytes with no drift, yielding 7,781 nodes.

## site-desktop.spec.txt

A flattened dump of the `Site desktop` frame — every node with its size,
position, fills, typography, auto-layout gaps/padding, corner radius and text.
Generated from the above; regenerate after any design change.

**Known gap:** `INSTANCE` nodes are not expanded. Their content lives in the
`SYMBOL` definition plus per-instance overrides, so the FAQ items and the
footer show as empty instances in the dump. Resolving those means walking
`symbolData` / `overrides` — needed before the FAQ and footer can be built
from the file rather than from screenshots.

"""Walk the decoded .fig node tree and report the desktop page."""
import json, collections, sys

d = json.load(open("canvas.json"))
nodes = d["nodeChanges"]


def gid(g):
    return "%s:%s" % (g["sessionID"], g["localID"]) if isinstance(g, dict) else str(g)


by = {}
kids = collections.defaultdict(list)
for n in nodes:
    by[gid(n["guid"])] = n
    pi = n.get("parentIndex")
    if pi and pi.get("guid"):
        kids[gid(pi["guid"])].append(n)

# Figma orders siblings by the fractional "position" string.
for k in kids:
    kids[k].sort(key=lambda n: n["parentIndex"].get("position", ""))

ROOT = next(gid(n["guid"]) for n in nodes if n.get("name") == "Site desktop")


def hexcolor(c):
    if not c:
        return None
    f = lambda v: max(0, min(255, round(v * 255)))
    s = "#%02x%02x%02x" % (f(c.get("r", 0)), f(c.get("g", 0)), f(c.get("b", 0)))
    a = c.get("a", 1)
    return s if a >= 0.999 else "%s @%.2f" % (s, a)


def fills(n):
    out = []
    for p in n.get("fillPaints") or []:
        if p.get("visible") is False:
            continue
        t = p.get("type")
        if t == "SOLID":
            out.append(hexcolor(p.get("color")))
        elif t and "GRADIENT" in t:
            stops = [hexcolor(s.get("color")) for s in p.get("stops") or []]
            out.append("%s(%s)" % (t, ", ".join(str(s) for s in stops)))
        elif t == "IMAGE":
            out.append("IMAGE")
    return [o for o in out if o]


def typography(n):
    if not n.get("fontSize"):
        return None
    fn = n.get("fontName") or {}
    lh = n.get("lineHeight") or {}
    u = lh.get("units")
    v = lh.get("value", 0)
    lhs = "%.0f%%" % v if u == "PERCENT" else ("%.0fpx" % v if u == "PIXELS" else "%.2f" % v)
    return "%s %s %gpx/%s" % (fn.get("family"), fn.get("style"), n["fontSize"], lhs)


def text_of(n):
    td = n.get("textData") or {}
    return td.get("characters")


def walk(guid, depth=0, maxdepth=99):
    n = by[guid]
    if depth > maxdepth:
        return
    sz = n.get("size") or {}
    tr = n.get("transform") or {}
    bits = ["%-13s %s" % (n["type"], n.get("name"))]
    if sz:
        bits.append("%gx%g" % (round(sz.get("x", 0), 1), round(sz.get("y", 0), 1)))
    if tr:
        bits.append("@%g,%g" % (round(tr.get("m02", 0), 1), round(tr.get("m12", 0), 1)))
    f = fills(n)
    if f:
        bits.append("fill=%s" % ",".join(str(x) for x in f))
    t = typography(n)
    if t:
        bits.append(t)
    for key, label in (("stackSpacing", "gap"), ("stackPadding", "padT"),
                       ("stackHorizontalPadding", "padX"), ("stackVerticalPadding", "padY")):
        if n.get(key):
            bits.append("%s=%g" % (label, n[key]))
    if n.get("cornerRadius"):
        bits.append("r=%g" % n["cornerRadius"])
    txt = text_of(n)
    if txt:
        bits.append("TEXT=%r" % (txt[:90],))
    print("  " * depth + " | ".join(bits))
    for c in kids.get(guid, []):
        walk(gid(c["guid"]), depth + 1, maxdepth)


if __name__ == "__main__":
    md = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    start = sys.argv[2] if len(sys.argv) > 2 else ROOT
    walk(start, 0, md)

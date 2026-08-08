"""Decoder for Figma .fig files (fig-kiwi container + embedded Kiwi schema)."""
import struct, zlib, sys, json

TYPE_BOOL, TYPE_BYTE, TYPE_INT, TYPE_UINT = -1, -2, -3, -4
TYPE_FLOAT, TYPE_STRING, TYPE_INT64, TYPE_UINT64 = -5, -6, -7, -8
KIND_ENUM, KIND_STRUCT, KIND_MESSAGE = 0, 1, 2


class Reader:
    def __init__(self, data):
        self.d = data
        self.i = 0

    def byte(self):
        v = self.d[self.i]
        self.i += 1
        return v

    def varuint(self):
        value = shift = 0
        while True:
            b = self.byte()
            value |= (b & 0x7F) << shift
            shift += 7
            if not (b & 0x80):
                return value & 0xFFFFFFFF

    def varint(self):
        v = self.varuint()
        return (v >> 1) ^ -(v & 1)

    def varuint64(self):
        # 8 groups of 7 bits, then a final byte contributing a full 8 bits.
        value = shift = 0
        while shift < 56:
            b = self.byte()
            value |= (b & 0x7F) << shift
            if b < 128:
                return value
            shift += 7
        return value | (self.byte() << 56)

    def varint64(self):
        v = self.varuint64()
        return (v >> 1) ^ -(v & 1)

    def float32(self):
        # Kiwi rotates the bits so common floats end in a zero byte.
        if self.d[self.i] == 0:
            self.i += 1
            return 0.0
        bits = struct.unpack_from("<I", self.d, self.i)[0]
        self.i += 4
        bits = ((bits << 23) | (bits >> 9)) & 0xFFFFFFFF
        return struct.unpack("<f", struct.pack("<I", bits))[0]

    def string(self):
        end = self.d.index(0, self.i)
        s = self.d[self.i:end].decode("utf-8", "replace")
        self.i = end + 1
        return s

    def bytes_(self):
        n = self.varuint()
        b = self.d[self.i:self.i + n]
        self.i += n
        return b


def parse_schema(data):
    r = Reader(data)
    defs = []
    for _ in range(r.varuint()):
        name = r.string()
        kind = r.byte()
        fields = []
        for _ in range(r.varuint()):
            fname = r.string()
            ftype = r.varint()
            is_array = bool(r.byte())
            value = r.varuint()
            fields.append({"name": fname, "type": ftype, "array": is_array, "value": value})
        defs.append({"name": name, "kind": kind, "fields": fields})
    return defs


class Decoder:
    def __init__(self, defs):
        self.defs = defs
        self.by_name = {d["name"]: i for i, d in enumerate(defs)}

    def value(self, r, t):
        if t == TYPE_BOOL:   return bool(r.byte())
        if t == TYPE_BYTE:   return r.byte()
        if t == TYPE_INT:    return r.varint()
        if t == TYPE_UINT:   return r.varuint()
        if t == TYPE_FLOAT:  return r.float32()
        if t == TYPE_STRING: return r.string()
        if t == TYPE_INT64:  return r.varint64()
        if t == TYPE_UINT64: return r.varuint64()
        return self.compound(r, self.defs[t])

    def compound(self, r, d):
        if d["kind"] == KIND_ENUM:
            v = r.varuint()
            for f in d["fields"]:
                if f["value"] == v:
                    return f["name"]
            return v
        if d["kind"] == KIND_STRUCT:
            return {f["name"]: self.field(r, f) for f in d["fields"]}
        out = {}
        by_id = {f["value"]: f for f in d["fields"]}
        while True:
            fid = r.varuint()
            if fid == 0:
                return out
            f = by_id.get(fid)
            if f is None:
                raise ValueError("unknown field id %d in %s" % (fid, d["name"]))
            out[f["name"]] = self.field(r, f)

    def field(self, r, f):
        if f["array"]:
            return [self.value(r, f["type"]) for _ in range(r.varuint())]
        return self.value(r, f["type"])


def read_fig(path):
    raw = open(path, "rb").read()
    assert raw[:8] == b"fig-kiwi", raw[:8]
    version = struct.unpack_from("<I", raw, 8)[0]
    i = 12
    chunks = []
    while i + 4 <= len(raw):
        n = struct.unpack_from("<I", raw, i)[0]
        i += 4
        blob = raw[i:i + n]
        i += n
        if len(blob) < n:
            break
        # Older .fig files deflate each chunk; newer ones use zstd.
        if blob[:4] == b"\x28\xb5\x2f\xfd":
            from compression import zstd
            blob = zstd.decompress(blob)
        else:
            try:
                blob = zlib.decompress(blob, -15)
            except zlib.error:
                pass
        chunks.append(blob)
    return version, chunks


if __name__ == "__main__":
    version, chunks = read_fig(sys.argv[1])
    print("version", version, "chunks", [len(c) for c in chunks], file=sys.stderr)
    defs = parse_schema(chunks[0])
    print("definitions", len(defs), file=sys.stderr)
    root = "Message"
    dec = Decoder(defs)
    r = Reader(chunks[1])
    data = dec.compound(r, defs[dec.by_name[root]])
    print("consumed %d/%d" % (r.i, len(chunks[1])), file=sys.stderr)
    json.dump(data, open(sys.argv[2], "w"), ensure_ascii=False)
    print("wrote", sys.argv[2], file=sys.stderr)

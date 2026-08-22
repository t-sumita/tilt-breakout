"""Placeholder favicon generator (pure stdlib, no Pillow).
Draws: indigo bg, a cyan ring (rotating-ring motif) and a tilted paddle bar.
Run: python scripts/gen_favicon.py
Output icons are intentionally simple placeholders; replace with real art later.
"""
import struct
import zlib
import math
import os

BG = (0x0b, 0x10, 0x20)
LINE = (0x7f, 0xe3, 0xd4)
BALL = (0xdf, 0xf7, 0xf2)


def make_png(path, size):
    cx = cy = size / 2
    ring_r = size * 0.34
    ring_th = max(1.4, size * 0.055)
    paddle_hw = size * 0.30
    paddle_hh = max(1.2, size * 0.045)
    tilt = math.radians(-18)
    paddle_cy = size * 0.66
    ball_r = max(1.2, size * 0.06)
    ball_x = cx + size * 0.16
    ball_y = size * 0.30

    def blend(under, over, a):
        return tuple(round(u + (o - u) * a) for u, o in zip(under, over))

    def coverage_ring(px, py):
        d = math.hypot(px - cx, py - cy)
        dist_to_line = abs(d - ring_r)
        return max(0.0, min(1.0, 1.0 - (dist_to_line - ring_th / 2)))

    def coverage_paddle(px, py):
        dx, dy = px - cx, py - paddle_cy
        lx = dx * math.cos(-tilt) - dy * math.sin(-tilt)
        ly = dx * math.sin(-tilt) + dy * math.cos(-tilt)
        if abs(lx) <= paddle_hw and abs(ly) <= paddle_hh:
            return 1.0
        ox = max(0.0, abs(lx) - paddle_hw)
        oy = max(0.0, abs(ly) - paddle_hh)
        return max(0.0, 1.0 - math.hypot(ox, oy))

    def coverage_ball(px, py):
        d = math.hypot(px - ball_x, py - ball_y)
        return max(0.0, min(1.0, 1.0 - (d - ball_r)))

    rows = []
    for y in range(size):
        row = bytearray()
        row.append(0)  # filter type 0
        for x in range(size):
            px, py = x + 0.5, y + 0.5
            col = BG
            col = blend(col, LINE, coverage_ring(px, py))
            col = blend(col, LINE, coverage_paddle(px, py))
            col = blend(col, BALL, coverage_ball(px, py))
            row.extend(col)
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    base = os.path.join(os.path.dirname(__file__), "..", "assets")
    make_png(os.path.join(base, "favicon-32.png"), 32)
    make_png(os.path.join(base, "favicon-180.png"), 180)
    print("done")

"""Production favicon generator (pure stdlib, no Pillow).
Draws: indigo background, a cyan rotating ring with a gap (stage3 の回転リング
ギャップを象徴)+ 傾いたパドルバー + ボール。assets/favicon.svg と対の意匠。
Run: python scripts/gen_favicon.py
"""
import struct
import zlib
import math
import os

BG = (0x0b, 0x10, 0x20)
LINE = (0x7f, 0xe3, 0xd4)
BALL = (0xdf, 0xf7, 0xf2)

# リングの開口(ギャップ)角度レンジ(度、0°=右方向, 反時計回り基準の atan2 系)
GAP_START_DEG = 15
GAP_END_DEG = 75


def make_png(path, size):
    cx = cy = size / 2
    ring_r = size * 0.328
    ring_th = size * 0.072
    paddle_hw = size * 0.3125
    paddle_hh = max(1.4, size * 0.053)
    tilt = math.radians(-16)
    paddle_cy = size * 0.6875
    ball_r = max(1.4, size * 0.066)
    ball_cx, ball_cy = size * 0.68, size * 0.273

    def blend(under, over, a):
        return tuple(round(u + (o - u) * a) for u, o in zip(under, over))

    def coverage_ring(px, py):
        dx, dy = px - cx, py - cy
        d = math.hypot(dx, dy)
        dist_to_line = abs(d - ring_r)
        cov = max(0.0, min(1.0, 1.0 - (dist_to_line - ring_th / 2)))
        if cov <= 0.0:
            return 0.0
        ang = math.degrees(math.atan2(-dy, dx)) % 360
        if GAP_START_DEG <= ang <= GAP_END_DEG:
            return 0.0
        return cov

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
        d = math.hypot(px - ball_cx, py - ball_cy)
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

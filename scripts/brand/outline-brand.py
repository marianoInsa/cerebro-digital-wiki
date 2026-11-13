#!/usr/bin/env python3
"""Outline the Ceniza y Hierro wordmark and monogram from Archivo Black.

Dev-time only. Downloads Archivo Black to the OS temp dir, traces the glyphs to
SVG path data with fontTools, then deletes the downloaded TTF. No font binary is
committed. Run from the repo root:

    python scripts/brand/outline-brand.py

Outputs:
    quartz/static/brand/wordmark.svg
    quartz/static/brand/monogram.svg
"""

import os
import sys
import tempfile
import urllib.request

from fontTools.pens.basePen import BasePen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
from fontTools.ttLib import TTFont

FONT_URL = "https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf"
FONT_NAME = "ArchivoBlack.ttf"

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "quartz", "static", "brand")

INK = "#17191A"
PAPER = "#F2F0EA"


def fetch_font():
    """Download the TTF to the temp dir unless it is already cached there."""
    path = os.path.join(tempfile.gettempdir(), FONT_NAME)
    if not os.path.exists(path):
        sys.stderr.write("downloading %s\n" % FONT_URL)
        urllib.request.urlretrieve(FONT_URL, path)
    return path


class CompactPathPen(BasePen):
    """Emit one relative SVG path: implicit command repetition, integer coords."""

    def __init__(self, glyphSet):
        super().__init__(glyphSet)
        self.parts = []
        self.cmd = None
        self.sep = False
        self.x = 0
        self.y = 0
        self.sx = 0
        self.sy = 0
        self.xmin = self.ymin = float("inf")
        self.xmax = self.ymax = float("-inf")

    def _track(self, x, y):
        self.xmin = min(self.xmin, x)
        self.ymin = min(self.ymin, y)
        self.xmax = max(self.xmax, x)
        self.ymax = max(self.ymax, y)

    def _num(self, v):
        if v >= 0 and self.sep:
            self.parts.append(" ")
        self.parts.append(str(v))
        self.sep = True

    def _emit(self, cmd, pts):
        """One command, one coordinate group. Relative coords anchor at the
        point before the group, not at the previous control point."""
        if cmd != self.cmd:
            self.parts.append(cmd)
            self.cmd = cmd
            self.sep = False
        ax, ay = self.x, self.y
        last = None
        for x, y in pts:
            ix, iy = int(round(x)), int(round(y))
            self._track(ix, iy)
            self._num(ix - ax)
            self._num(iy - ay)
            last = (ix, iy)
        self.x, self.y = last

    def _moveTo(self, pt):
        self._emit("m", [pt])
        self.sx, self.sy = self.x, self.y

    def _lineTo(self, pt):
        self._emit("l", [pt])

    def _curveToOne(self, p1, p2, p3):
        self._emit("c", [p1, p2, p3])

    def _qCurveToOne(self, p1, p2):
        self._emit("q", [p1, p2])

    def _closePath(self):
        self.parts.append("z")
        self.cmd = "z"
        self.sep = False
        self.x, self.y = self.sx, self.sy

    def _endPath(self):
        self._closePath()

    def d(self):
        return "".join(self.parts)


def load_kerning(font):
    """Collect GPOS pair kerning (class based) as {(left, right): xadvance}."""
    if "GPOS" not in font:
        return {}
    out = {}
    for lookup in font["GPOS"].table.LookupList.Lookup:
        for sub in lookup.SubTable:
            if lookup.LookupType == 9:
                sub = sub.ExtSubTable
            if getattr(sub, "Format", None) != 2 or not hasattr(sub, "Class1Record"):
                continue
            coverage = set(sub.Coverage.glyphs)
            c1 = sub.ClassDef1.classDefs
            c2 = sub.ClassDef2.classDefs
            for left, right in KERN_PROBES:
                if left not in coverage:
                    continue
                rec = sub.Class1Record[c1.get(left, 0)].Class2Record[c2.get(right, 0)]
                value = rec.Value1.XAdvance if rec.Value1 and rec.Value1.XAdvance else 0
                if value and (left, right) not in out:
                    out[(left, right)] = value
    return out


def build_paths(font, text, tracking, scale, origin_x, cap_top):
    """Trace `text` and return (d, bbox) in final output units."""
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    hmtx = font["hmtx"]
    kern = KERN
    pen = CompactPathPen(glyph_set)
    x = 0
    prev = None
    for ch in text:
        name = cmap[ord(ch)]
        advance, _lsb = hmtx[name]
        if prev is not None:
            x += (kern.get((prev, name), 0) + tracking) * 1.0
        # flip y (font units are y-up) and place at the baseline
        t = Transform(scale, 0, 0, -scale, origin_x + x * scale, cap_top)
        glyph_set[name].draw(TransformPen(pen, t))
        x += advance
        prev = name
    return pen.d(), (pen.xmin, pen.ymin, pen.xmax, pen.ymax)


def wordmark(font):
    cap_height = font["OS/2"].sCapHeight or 700
    scale = 1000.0 / cap_height  # cap height becomes 1000 output units
    text = "Cerebro Digital"
    tracking = -34
    d, (x0, y0, x1, y1) = build_paths(font, text, tracking, scale, 0, 0)
    w = int(round(x1 - x0))
    h = int(round(y1 - y0))
    d, _ = build_paths(font, text, tracking, scale, -x0, -y0)
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" '
        'height="%d" role="img" aria-label="Cerebro Digital">'
        '<title>Cerebro Digital</title>'
        '<path fill="%s" d="%s"/></svg>\n' % (w, h, w, h, INK, d)
    )
    return svg, w, h


def monogram(font):
    size = 1024
    pad = 26  # horizontal breathing room; the pair is wider than it is tall
    text = "CD"
    tracking = 90  # opens the gap between C and D so the mark stays legible at 16px

    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    names = [cmap[ord(c)] for c in text]
    pair_width = hmtx[names[0]][0] + tracking + hmtx[names[1]][0]

    scale = (size - 2 * pad) / pair_width  # output units per font unit
    d, (x0, y0, x1, y1) = build_paths(font, text, tracking, scale, 0, 0)
    # centre the ink box on both axes
    dx = (size - (x1 - x0)) / 2 - x0
    dy = (size - (y1 - y0)) / 2 - y0
    d, _ = build_paths(font, text, tracking, scale, dx, dy)
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" '
        'height="%d" role="img" aria-label="Cerebro Digital">'
        '<title>Cerebro Digital</title>'
        '<rect width="%d" height="%d" fill="%s"/>'
        '<path fill="%s" d="%s"/></svg>\n' % (size, size, size, size, size, size, PAPER, INK, d)
    )
    return svg


KERN_PROBES = [
    ("C", "e"), ("C", "D"), ("D", "i"), ("e", "b"), ("b", "r"), ("r", "o"),
    ("o", "space"), ("space", "D"), ("D", "i"), ("i", "g"), ("g", "i"),
    ("i", "t"), ("t", "a"), ("a", "l"), ("l", "C"), ("o", "D"),
]
KERN = {}


def main():
    path = fetch_font()
    font = TTFont(path)
    global KERN, KERN_PROBES
    KERN_PROBES = [
        (font.getBestCmap()[ord(a)], font.getBestCmap()[ord(b)])
        for a, b in [
            ("C", "e"), ("e", "r"), ("r", "e"), ("e", "b"), ("b", "r"), ("r", "o"),
            ("o", " "), (" ", "D"), ("D", "i"), ("i", "g"), ("g", "i"), ("i", "t"),
            ("t", "a"), ("a", "l"), ("C", "D"),
        ]
    ]
    KERN = load_kerning(font)

    os.makedirs(OUT_DIR, exist_ok=True)
    wm, w, h = wordmark(font)
    with open(os.path.join(OUT_DIR, "wordmark.svg"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(wm)
    print("wordmark.svg %dx%d %d bytes" % (w, h, len(wm.encode("utf-8"))))

    mono = monogram(font)
    with open(os.path.join(OUT_DIR, "monogram.svg"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(mono)
    print("monogram.svg 1024x1024 %d bytes" % len(mono.encode("utf-8")))

    font.close()
    os.remove(path)
    print("removed %s" % path)


if __name__ == "__main__":
    main()

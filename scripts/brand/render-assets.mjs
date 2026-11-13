// Rasterize the Ceniza y Hierro brand assets from their SVG sources.
// Dev-time only, never part of the Quartz build. Run from the repo root:
//
//     node scripts/brand/render-assets.mjs            # icons + cover plate
//     node scripts/brand/render-assets.mjs icons      # icons only
//     node scripts/brand/render-assets.mjs plate      # cover plate only
//
// Uses the sharp already installed for the site. No new dependencies.

import { mkdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const ROOT = process.cwd()
const BRAND = path.join(ROOT, "quartz", "static", "brand")
const MONOGRAM = path.join(BRAND, "monogram.svg")
const PLATE_SVG = path.join(BRAND, "cover-plate.svg")

const PNG_TARGETS = [
  [path.join(BRAND, "favicon-16.png"), 16],
  [path.join(BRAND, "favicon-32.png"), 32],
  [path.join(BRAND, "favicon-512.png"), 512],
  [path.join(BRAND, "apple-touch-icon.png"), 180],
  [path.join(ROOT, "quartz", "static", "icon.png"), 512],
]

async function report(file) {
  const meta = await sharp(file).metadata()
  const { size } = await stat(file)
  console.log(
    `${path.relative(ROOT, file).replace(/\\/g, "/")}  ${meta.width}x${meta.height}  ${size} B  ${
      meta.hasAlpha ? "alpha" : "opaque"
    }`,
  )
}

async function icons() {
  await mkdir(BRAND, { recursive: true })
  for (const [file, size] of PNG_TARGETS) {
    // The monogram paints a full paper square, so every icon stays opaque.
    await sharp(MONOGRAM)
      .resize(size, size, { kernel: "lanczos3" })
      .flatten({ background: "#F2F0EA" })
      .png({ compressionLevel: 9 })
      .toFile(file)
  }
}

// --- cover plate ---------------------------------------------------------

const W = 1600
const H = 1200

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (v) => Math.round(v * 10) / 10

// Bare slanted tree: one path per depth, strokes tapered by depth.
function growTree(rnd, x, y, angle, len, depth, maxDepth, out) {
  const x2 = x + Math.cos(angle) * len
  const y2 = y + Math.sin(angle) * len
  const bend = len * 0.2 * (rnd() - 0.5)
  const mx = (x + x2) / 2 + Math.cos(angle + Math.PI / 2) * bend
  const my = (y + y2) / 2 + Math.sin(angle + Math.PI / 2) * bend
  ;(out[depth] ||= []).push(`M${n(x)} ${n(y)}Q${n(mx)} ${n(my)} ${n(x2)} ${n(y2)}`)
  if (depth >= maxDepth) return
  const kids = depth === 0 ? 3 : rnd() < 0.3 ? 3 : 2
  for (let i = 0; i < kids; i++) {
    const spread = (i - (kids - 1) / 2) * (0.34 + rnd() * 0.26)
    growTree(
      rnd,
      x2,
      y2,
      angle + spread + (rnd() - 0.5) * 0.16,
      len * (0.58 + rnd() * 0.14),
      depth + 1,
      maxDepth,
      out,
    )
  }
}

function treeMarkup(seed, x, y, lean, len, maxDepth, ink, opacity) {
  const rnd = mulberry32(seed)
  const out = []
  growTree(rnd, x, y, -Math.PI / 2 + lean, len, 0, maxDepth, out)
  return out
    .map((group, depth) => {
      const w = Math.max(0.9, (maxDepth - depth + 1) ** 1.4 * 0.42)
      return `<path d="${group.join("")}" stroke="${ink}" stroke-width="${n(w)}" stroke-linecap="round" fill="none" opacity="${n(opacity * (1 - depth * 0.04))}"/>`
    })
    .join("\n    ")
}

// Horizontal stone strata: keeps the dark mass from reading as flat fill.
function mottle() {
  const rnd = mulberry32(4471)
  const out = []
  for (let i = 0; i < 20; i++) {
    const cx = rnd() * W
    const cy = 900 + rnd() * 290
    const rx = 340 + rnd() * 620
    const ry = 5 + rnd() * 14
    const light = rnd() > 0.52
    const fill = light ? "#596264" : "#0E1215"
    out.push(
      `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" opacity="${n(0.04 + rnd() * 0.07)}"/>`,
    )
  }
  return out.join("\n    ")
}

function coverSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <title>Lámina de portada: árbol inclinado sobre una cresta de piedra, niebla fría</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#A6ADAC"/>
      <stop offset="0.32" stop-color="#BEC2BE"/>
      <stop offset="0.58" stop-color="#D2CFC5"/>
      <stop offset="0.78" stop-color="#DED4C1"/>
      <stop offset="1" stop-color="#E9DFC9"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3E4649"/>
      <stop offset="0.4" stop-color="#2A2F33"/>
      <stop offset="1" stop-color="#15191C"/>
    </linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0" stop-color="#5C6568"/>
      <stop offset="0.55" stop-color="#454D50"/>
      <stop offset="1" stop-color="#2F3639"/>
    </linearGradient>
    <radialGradient id="haze" cx="0.58" cy="0.6" r="0.52">
      <stop offset="0" stop-color="#F1E7D3" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#F1E7D3" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F0EADB" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#F0EADB" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#F4EEDE" stop-opacity="0.62"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.44" r="0.76">
      <stop offset="0.5" stop-color="#2A2F33" stop-opacity="0"/>
      <stop offset="1" stop-color="#2A2F33" stop-opacity="0.18"/>
    </radialGradient>
    <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="16"/>
    </filter>
    <filter id="softer" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40"/>
    </filter>
    <filter id="edge" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#haze)"/>

  <!-- far ridges folded into the mist -->
  <g filter="url(#edge)" opacity="0.45">
    <path fill="#8D9698" d="M0 720 L0 692 Q130 668 244 690 Q360 712 476 684 Q590 656 706 686 Q820 716 940 688 Q1052 662 1174 690 Q1300 720 1412 696 Q1518 674 1600 698 L1600 762 L0 762 Z"/>
  </g>
  <g filter="url(#edge)" opacity="0.4">
    <path fill="#6C7679" d="M0 776 L0 744 Q152 714 302 740 Q456 766 606 738 Q748 712 894 742 Q1046 772 1194 744 Q1352 714 1600 750 L1600 816 L0 816 Z"/>
  </g>

  <!-- oxblood underlight along the horizon -->
  <ellipse cx="660" cy="778" rx="660" ry="34" fill="#7A2E28" opacity="0.12" filter="url(#softer)"/>

  <!-- empty cloister arcade: stone only, no figures, no emblems -->
  <g>
    <path fill="url(#wall)" d="M88 900 L88 648 Q88 632 104 632 L176 632 L178 626 L214 626 L214 638 L300 638 L302 620 L346 620 L346 636 L420 636 L422 630 L470 630 L470 640 L516 640 Q532 640 532 656 L532 900 Z"/>
    <path fill="#828E90" opacity="0.22" d="M104 632 L176 632 L178 626 L214 626 L214 638 L300 638 L302 620 L346 620 L346 636 L420 636 L422 630 L470 630 L470 640 L516 640 Q532 640 532 656 L532 662 L104 662 Z"/>
    <path fill="#20272A" d="M132 900 L132 726 Q132 662 182 662 Q232 662 232 726 L232 900 Z"/>
    <path fill="#252C2F" d="M262 900 L262 720 Q262 654 314 654 Q366 654 366 720 L366 900 Z"/>
    <path fill="#1D2427" d="M396 900 L396 726 Q396 662 446 662 Q496 662 496 726 L496 900 Z"/>
    <!-- coursing, drawn as hairlines so the stone reads as built -->
    <g stroke="#93A0A2" stroke-width="1" opacity="0.16">
      <path d="M88 690 L532 690"/>
      <path d="M88 742 L532 742"/>
      <path d="M88 792 L532 792"/>
    </g>
    <!-- broken lower wall reaching right -->
    <path fill="#394144" d="M532 900 L532 762 L602 754 L650 768 L650 900 Z"/>
    <path fill="#828D8F" opacity="0.2" d="M532 762 L602 754 L650 768 L650 774 L532 780 Z"/>
  </g>

  <!-- mist floor rising through the arcade -->
  <g filter="url(#soft)">
    <path fill="url(#fog)" opacity="0.7" d="M0 714 Q400 726 806 712 Q1200 698 1600 720 L1600 890 L0 890 Z"/>
  </g>

  <!-- crest -->
  <path fill="url(#ground)" d="M0 1200 L0 866 Q200 828 396 848 Q572 866 764 840 Q946 814 1128 842 Q1330 872 1600 830 L1600 1200 Z"/>
  <path fill="none" stroke="#8B9597" stroke-width="2" opacity="0.34" d="M0 866 Q200 828 396 848 Q572 866 764 840 Q946 814 1128 842 Q1330 872 1600 830"/>

  <g>
    ${mottle()}
  </g>

  <!-- stone slabs set into the crest -->
  <g fill="#2A3134" opacity="0.5">
    <path d="M148 944 L262 936 L292 956 L166 966 Z"/>
    <path d="M636 932 L736 924 L762 940 L658 950 Z" opacity="0.7"/>
    <path d="M1176 948 L1294 940 L1322 958 L1202 968 Z" opacity="0.6"/>
  </g>
  <g stroke="#8B9597" stroke-width="1.4" opacity="0.18" fill="none">
    <path d="M148 944 L262 936"/>
    <path d="M636 932 L736 924"/>
    <path d="M1176 948 L1294 940"/>
  </g>

  <!-- cropped foreground ledge: one more depth layer at the bottom edge -->
  <path fill="#222A2D" d="M0 1200 L0 1138 Q240 1112 470 1128 Q760 1148 1040 1122 Q1320 1096 1600 1124 L1600 1200 Z"/>
  <path stroke="#7E8A8C" stroke-width="1.5" opacity="0.14" fill="none" d="M0 1138 Q240 1112 470 1128 Q760 1148 1040 1122 Q1320 1096 1600 1124"/>

  <!-- the slanted tree -->
  <g>
    ${treeMarkup(20261112, 1132, 878, -0.36, 250, 6, "#1B2023", 0.95)}
  </g>
  <g opacity="0.34">
    ${treeMarkup(771, 296, 852, -0.16, 96, 5, "#2C3437", 0.9)}
  </g>

  <!-- second mist pass, softens the tree base into the stone -->
  <g filter="url(#soft)">
    <path fill="url(#fog)" opacity="0.55" d="M0 846 Q400 826 820 848 Q1200 868 1600 840 L1600 940 L0 940 Z"/>
  </g>

  <!-- oxblood stain in the near stone -->
  <ellipse cx="404" cy="1074" rx="300" ry="52" fill="#7A2E28" opacity="0.06" filter="url(#softer)"/>

  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>
`
}

// 3.5% block grain, kept in the raster step so the editable SVG stays small.
async function grainOverlay(width, height, block, amount) {
  const gw = Math.ceil(width / block)
  const gh = Math.ceil(height / block)
  const buf = Buffer.alloc(gw * gh * 4)
  const rnd = mulberry32(9917)
  for (let i = 0; i < gw * gh; i++) {
    const v = rnd()
    const light = v > 0.5
    buf[i * 4] = light ? 255 : 0
    buf[i * 4 + 1] = light ? 255 : 0
    buf[i * 4 + 2] = light ? 255 : 0
    buf[i * 4 + 3] = Math.round(amount * 255 * (0.55 + 0.9 * Math.abs(v - 0.5)))
  }
  return sharp(buf, { raw: { width: gw, height: gh, channels: 4 } })
    .resize(width, height, { kernel: "nearest" })
    .png()
    .toBuffer()
}

async function plate() {
  const svg = coverSvg()
  await writeFile(PLATE_SVG, svg)
  console.log(`cover-plate.svg ${Buffer.byteLength(svg)} B`)

  const flat = await sharp(Buffer.from(svg)).resize(W, H, { fit: "fill" }).toBuffer()
  const overlay = await grainOverlay(W, H, 3, 0.035)
  const grained = await sharp(flat)
    .composite([{ input: overlay, blend: "over" }])
    .removeAlpha()
    .toBuffer()

  const webp = await sharp(grained)
    .webp({ quality: 80, effort: 6, smartSubsample: true })
    .toBuffer()
  const avif = await sharp(grained)
    .avif({ quality: 52, effort: 6, chromaSubsampling: "4:2:0" })
    .toBuffer()
  await writeFile(path.join(BRAND, "cover-plate-1600x1200.webp"), webp)
  await writeFile(path.join(BRAND, "cover-plate-1600x1200.avif"), avif)
  console.log(`cover-plate-1600x1200.webp ${webp.length} B`)
  console.log(`cover-plate-1600x1200.avif ${avif.length} B`)
}

const mode = process.argv[2] ?? "all"
if (mode === "all" || mode === "icons") await icons()
if (mode === "all" || mode === "plate") await plate()
if (mode === "all" || mode === "icons") {
  for (const [file] of PNG_TARGETS) await report(file)
}

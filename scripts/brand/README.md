# Brand asset generators — Ceniza y Hierro

Dev-time only. Nothing here runs during the Quartz build.

```
python scripts/brand/outline-brand.py     # wordmark.svg + monogram.svg
node scripts/brand/render-assets.mjs      # favicons, icon.png, cover plate WebP/AVIF
```

`outline-brand.py` needs `fontTools`. It downloads Archivo Black to the OS temp
directory, traces the glyphs to relative `<path>` data, then deletes the TTF.
No font binary is committed. If the download fails, the script stops; the
committed SVGs stay valid because they carry no font reference.

`render-assets.mjs` uses the `sharp` already installed for the site to rasterize
`monogram.svg` into the favicons and `quartz/static/icon.png`, and
`cover-plate.svg` into the 1600x1200 WebP/AVIF plate. Grain and vignette live in
the raster step: the SVG keeps a 1.5% vignette gradient, the grain is a 3.5%
block-noise overlay composited at encode time so the editable SVG stays small.

Regenerate only when the art changes; commit the outputs, not the font.

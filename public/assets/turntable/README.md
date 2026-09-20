# Photographic turntable assets

The three images were generated and supplied by the user on 2026-09-09. No external research photographs are shipped. Each final file is genuine WebP; the tonearm preserves the supplied transparent alpha channel.

- `turntable-plinth.webp`: normalized photographic platter centered at 42% / 52%, 73% diameter. The original photograph is scaled, with small mirrored photo strips extending its outer background. The page blends its top and bottom into the metal surface without a card perimeter.
- `tonearm.webp`: complete physical assembly, including counterweight, bearing, tube, headshell, cartridge and stylus. Its image bearing is at 50% / 21%; the scene pivot is 82% / 28.1%.
- `metal-noise.webp`: supplied metal photograph with reduced brightness; no generated CSS grain or hardware.

Original PNGs remain locally under `tmp/imagegen/turntable-originals/`. [GENERATE.md](GENERATE.md) preserves the independent prompts; [sources.json](sources.json) records image geometry.

`TurntableScene` layers these images with the shared `VinylDisc`. `PhotographicTonearm` keeps a stable image node, holds position on pause, returns for 600 ms when the album changes, and cues for 650 ms before tracking from 25° to 43°. Reduced motion disables transitions. The existing audio engine and playback callbacks are unchanged.

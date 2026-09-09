# Vinyl UI acceptance — 2026-09-09

Browser viewport emulation was checked at **320×568, 360×800, 375×812, 390×844, 393×852, 412×915, 430×932**. These are browser checks, not physical-device tests.

## Verified behavior

- Collection: each item owns its sleeve, disc, title and artist. Two equal grid columns, ellipsis, metadata containment, shelf edges below text, and bottom-navigation clearance passed at all seven sizes. The four-item last page was also checked.
- Album Detail: one 56px segmented control, two actual 30px vinyl thumbnails, equal segments and aligned sliding indicator at every size. A/B heading, durations, prefixes and center label commit together. Rapid reversal and arrow-key selection were exercised.
- Side transition frame observer: no disc/texture/label replacement, no texture-source changes, whole-disc opacity always 1, outer surface transform unchanged. Both fade phases occur. Timing samples vary with browser foreground rendering, so the report does not claim a constant frame rate.
- MiniPlayer: 66px tray, 40px shared VinylDisc and 40px play button; text and controls remain separate at all widths. Play/pause does not open the full player; the tray does. Rotation runs during playback and pauses without resetting. Clear and liquid textures were checked in the actual app.
- Full Player: photographic full-width scene without a card border, record diameter 68% of viewport width, 56px play button, all transport and utility controls visible at all seven sizes. Supplied plinth, metal and alpha-tonearm images load successfully.
- Tonearm fixture: stable image instance through cueing, paused seek, inward tracking, album return and re-cue; switching lyrics/turntable keeps the same instance. History records `rest 0 → cueing 25 → tracking 43 → returning 0 → cueing 25`.
- All sixteen record texture names loaded their own image, including the picture-disc groove overlay. User-supplied PNG content was converted to genuine WebP; transparent alpha was preserved.

## Checks

`npm run lint`, `npm run build`, `npx tsx --test src/utils/vinylSides.test.ts` (5 passed), and `git diff --check` passed. The existing `src/App.tsx` routing/playback callbacks and `src/services/audioEngine.ts` were not changed. Playback-only album values retain pressing metadata so MiniPlayer and Full Player can display the correct side without altering collection storage.

## Reproduce

Run `npm run dev` and open the actual app for the seven-size layout matrix. Test fixtures are development-only Vite entrypoints:

- `/tests/browser/album-acceptance.html`: explicit 3LP C/D/E/F, empty-side playback and complete texture gallery.
- `/tests/browser/side-transition.html`: DOM identity, synchronized side data and per-frame fade observer.
- `/tests/browser/player-acceptance.html`: actual PlayerView with explicit album/progress controls and a visible tonearm history report.

Measurement JSON files in this directory retain actual viewport dimensions as well as results. Original generated image masters and temporary research files remain locally in ignored `tmp/`; no external research photo is included in the application.

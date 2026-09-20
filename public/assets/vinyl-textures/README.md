# Vinyl materials

All record surfaces are raster images. `VinylDisc` renders the image, a circular dynamic label and a spindle-hole mask; CSS only controls placement, shadow and motion. Home, Collection and Album Detail consume this same component.

## Available

`black`, `clear`, `translucent`, `red`, `blue`, `splatter-01` reuse the project's independent image-generation outputs from September 9, 2026. They are 1024px WebP images with alpha. `picture-base` is a transparent groove/reflection layer extracted from the black master. `paper-grain` is a crop from the blank paper label in the red master. See `sources.json`.

Clear/smoke transmission is encoded per pixel using the source highlights and rim. The component does not reduce the opacity of the entire disc.

## User-supplied materials

`white`, `green`, `orange`, `marbled-01`, `marbled-02`, `splatter-02`, `split-01`, `liquid-01`, `liquid-02` were supplied by the user from GPT and integrated on September 9, 2026. The original PNG content was converted to genuine 1024px WebP with alpha preserved. Original files are backed up under `tmp/imagegen/user-originals/`. All listed materials are available; no pending generation remains.

[GENERATE.md](GENERATE.md) retains the individual generation prompts. Home, Collection, Album Detail and MiniPlayer use the same texture mapping and VinylDisc component.

## Edition fields

```ts
{
  vinylType: 'marbled',
  vinylTexture: 'marbled-02',
  vinylColor: '#315447',
  vinylSecondaryColor: '#ddd4c4',
  vinylLabel: { color: '#e4decf', text: 'STEREO' },
  edition: 'Limited Edition',
  discs: [
    { disc: 1, sides: [{ side: 'A', tracks: [] }, { side: 'B', tracks: [] }] },
    { disc: 2, sides: [{ side: 'C', tracks: [] }, { side: 'D', tracks: [] }] }
  ]
}
```

Legacy `vinylVariant`/`vinylColors` remain supported. Missing edition data defaults to `black.webp`. Explicit `discs` preserve pressing order; legacy albums get a presentation-only split of the tracks actually present, with a disclosure in the archive footer. Side playback passes a temporary track subset to the existing selection callback and never writes it to collection storage.

## Verification

- `npm run lint`
- `npm run build`
- `npx tsx --test src/utils/vinylSides.test.ts`
- Local visual/interaction fixture: `/tests/browser/album-acceptance.html` (3LP, C/D/E/F, empty side, playback callback and texture gallery).
- Live browser checks: A/B list/label changes; keyboard switching; current-side playback; restoring full-album playback. Fixture checks: C/D numbering, D-only queue, E/F and disabled empty-side playback.

The unchanged audio engine is a playback simulation. These checks establish queue selection and UI behavior, not full recording playback or automatic track advancement.

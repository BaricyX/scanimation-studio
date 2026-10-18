# PLAYGROUND — Optical installation

Source of truth: the user's four-screen visual reference supplied on 18 October 2026. This revision covers the immersive home, Scanimation introduction, scrolling experiment directory, and working editor/export flow.

## Visual contract

- Background `--bg: #030304`; surface `--surface: #0b0b0d`.
- Text `--ink: #edeeeb`; secondary text `--muted: #93938f`.
- Divider `--line: #28282a`; metal `--silver: #c5c4c1`.
- Chinese display: platform Songti serif. Latin display: Georgia. Interface: Helvetica Neue / PingFang SC / Arial.
- Small tracked wordmark, single-line serif headline “让影像流动”, English tagline “IMAGES IN MOTION”, quiet editorial labels.
- Three physical materials: smoky glass, polished metal cable and rings, photographic stone tabletop.
- Optical artworks own the color. Surface gradients reproduce glass reflections and spectral material edges from the supplied reference.
- Home: striped smile, glass card at the left foreground, other independently linked cards behind, diagonal cold glass edge, warm lower sphere contour.
- Introduction: photographed standing cat scanimation installation; color and monochrome source photos; capsule creation action.
- Directory: continuous curved cable, alternating suspended artworks, index/title/English label, native searchable navigation for all eleven experiments.
- Editor: orange tabby photograph, four-frame sequence, photo/parameter tabs, stripe width, contrast and four animation directions. Secondary controls are collapsible.

## Working implementation

Buildless HTML/CSS/JavaScript. All eleven original experimental renderers remain available through named routes. Uploads remain in the browser. Scanimation uses Canvas to interleave source pixels with a matching draggable mask; no pixel reprocessing is performed on each playback frame.

The static preview shows the selected source beneath translucent optical glass. Pointer dragging and deliberate playback reveal the actual interleaved image and opaque mask, isolating animation frames. PNG/GIF/video exports use the computed pixels, direction and contrast. CSS optical highlights are preview materials.

`#home`, `#experiment/scanimation`, `#experiments`, and eleven `#editor/<slug>` routes. Source photo normalization: 1200 × 1500. PNG output: 600 × 750. Animated output: 360 × 450. GIF and MediaRecorder video remain local.

## Assets and generation prompts

All following raster assets were generated with the **built-in imagegen tool**. The supplied four-screen reference guided the first two assets; it is kept separate from the UI implementation. Source photographs and artwork are independent image layers. UI text, navigation, rings, cables, controls and cards remain editable code/native Figma layers.

- `assets/optical-atmosphere.jpg` — Prompt: photographic background texture only for the first reference screen; pitch-black portrait environment, a soft silver-blue glass contour descending diagonally from upper right, a large dark sphere with a thin warm pearl-copper rim along the lower edge, restrained grain and smoky reflection, ample dark negative space; no text, cards, cable, icons or UI.
- `assets/scanimation-installation.jpg` — Prompt: freestanding transparent glass scanimation installation on a rough charcoal stone table; front sheet reveals a warm orange-and-white tabby cat through fine vertical black stripes, a second offset smoky sheet carries a monochrome version; polished silver edges, raking studio light, actual cast shadows, dark sides and top; no text or UI.
- `assets/sunset.jpg` — Earlier source, retained as an unused asset. Prompt: portrait photograph of a young adult man seen from behind on an empty beach at dusk, black shirt, short dark hair, muted peach sunset and slate-blue ocean, natural film grain; original source photo with no stripes, glass, typography or UI.
- `assets/cat-source.jpg` — Prompt: clean ordinary portrait photograph of the orange tabby from the front installation, white muzzle and chest, amber-green eyes, charcoal background, face and ears fully visible; remove glass, stripes and tabletop; no UI or text.
- `assets/cat.jpg` — Earlier built-in imagegen portrait of a silver-grey short-haired cat on a dark ledge. Used as the perspective artwork source.

Optical smile, glass cube, folded botanical drawing, infinite photograph and color petals are code-native Canvas compositions. Their Figma raster fills are artwork assets, with independently editable card and text layers.

## Figma

[Editable design](https://www.figma.com/design/rxuM8vxmzpTRhOMvKqZgwm?node-id=6-33). Four main mobile views, shared components, variable-bound colors, text styles, and clickable main flow. Construction and actual node records are under `design/`.

## Validation boundaries

Automated Chrome checks exercise all eleven routes, upload count rules, reordering/removal, retained photos, mask dragging/playback, axis changes, pixel interleaving against independent red/blue fixtures, downloadable PNG/GIF, reduced motion, directory search, and 320/390/768/1440 px layouts. Pillow checks alpha and decodes all twenty GIF frames; video is loaded back into a browser to verify dimensions and duration.

iPhone Photos cross-app dragging and orientation permission behavior still require a physical iPhone. Video format depends on MediaRecorder support. Browser pages provide PNG, GIF and video; Live Photo pairing is outside this implementation.

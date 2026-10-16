# Phase 0B cinematic Home

Phase 0B changes the Home screen only. The operator approved the richer Home visual direction and the use of Three.js; Resident and Developer mode screens retain their existing styling and logic. The original Phase 0 Home is visible in [`outputs/phase0-home.png`](../outputs/phase0-home.png), and the revised Home in [`outputs/phase0b-desktop-1440.png`](../outputs/phase0b-desktop-1440.png). The [motion preview](../outputs/phase0b-motion-preview.mp4) shows the three camera chapters, a drag orbit, portal motion and entry to Resident mode.

## How the scene works

- `src/landing/world.ts` builds a fictional 3D township from Three.js geometry: buildings, a plaza, trees, pedestrian surfaces, shelter, lights and a colour-coded illustrative route. It contains no UTM campus geometry or measured environmental values.
- `src/landing/CinematicTownshipScene.tsx` renders the world through a perspective camera. Its angle advances at `0.081` radians/second, completing a full orbit in roughly 78 seconds. Dragging the empty world area changes the viewpoint directly. Three camera views use different height, focal point and field of view; transitions interpolate their properties while the world remains continuous.
- `src/landing/LandingHero.tsx` provides the fixed foreground interface, three 12-second chapters, pause control, visual quality selection and the two functional mode portals. Scene selection restarts that chapter's 12-second interval. Reduced-motion preference pauses camera and gradient animations initially.
- High quality uses shadows and up to 1.5 device pixel ratio. Balanced limits pixel ratio to 1, hides half the decorative trees, disables shadows and caps rendering to about 30 frames per second. Fallback is a labelled static concept preview with working mode buttons; it does not claim 360°.
- The Three.js scene is dynamically imported so the interface can paint while the 3D module loads. Its renderer, geometry and event listeners are disposed when leaving Home.

## Visual asset provenance

`resident-concept.png` and `developer-concept.png` in `public/assets/landing/` were generated specifically for this project with the built-in image generation tool. They are fictional concept artwork, not campus or Sime Darby Property photographs. Neither the supplied approved reference image nor the supplied motion video is copied into the app. No corporate logo is used.

The generation prompts were:

1. Resident portal: “A welcoming human-scale pedestrian corridor in an original fictional Malaysian future township, with mature shade trees, lush subtropical planting, elegant low-rise contemporary architecture and one or two small distant pedestrian silhouettes. Premium cinematic architectural visualisation; wide walkway eye-level view with space for HTML copy; warm golden-hour light, deep plum shadows and botanical emerald highlights. No logo, text, watermark, data readouts, visible faces or representation of a real campus or development.”
2. Developer portal: “An elegant township planning studio overlooking a lush original fictional Malaysian future township at twilight, with a small architect silhouette viewing a transparent spatial model of pedestrian corridors and landscape interventions. Premium cinematic architectural visualisation; wide composition from behind, with space for HTML copy; deep plum/violet ambient light and sunset amber. No logo, text, watermark, numerical data, identifiable face or representation of a real campus or development.”

Three.js `0.186.1` and its TypeScript definitions are MIT licensed. [Three.js installation documentation](https://threejs.org/manual/pages/installation.html) and [licence](https://github.com/mrdoob/three.js/blob/dev/LICENSE) are the upstream references.

## Verification and limitations

Desktop captures were checked at 1920×1080, 1440×900 and 1366×768; the mobile capture uses a 390px emulated viewport. Browser checks exercised chapter switching, pause, both role portals, reduced-motion styling, static fallback and WebGL rendering with no observed console exceptions or failed HTTP responses. The motion preview was captured in headless Chrome with software WebGL, so it is a visual review aid rather than a performance benchmark for the operator's laptop.

On that software renderer, two separate two-second requestAnimationFrame samples were about 8–11 FPS in High quality. Real hardware performance has not been measured. The environment is intentionally stylised rather than photorealistic, and orbit views may place a building in front of the illustrative route. The functional app still contains Phase 0 fixture and vision/GIS limitations documented in the root README and data dictionary. Only the operator can accept visual quality after launching it locally.

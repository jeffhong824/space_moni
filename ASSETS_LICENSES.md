# Asset licenses

SpaceMoni’s gamified `/sim` (and `/world`) view uses **procedural original art** drawn at runtime with Phaser Game Objects (circles, rectangles, text). There are **no NASA logos**, no third-party texture packs, and no paid assets in the repository.

| Asset | Source | License | Notes |
| --- | --- | --- | --- |
| Starfield, Sun, Earth analog, Moon analog, hull rectangles, module interiors, astronaut capsules | Drawn in `src/sim/FleetScene.ts` | Original work in this repository (CC0-equivalent: no third-party claim) | Not NASA imagery. Always labeled `SIMULATION`. |
| UI typefaces (Plus Jakarta Sans, JetBrains Mono, Noto Sans / TC / JP) | [Google Fonts](https://fonts.google.com/) | [SIL Open Font License](https://scripts.sil.org/OFL) | Loaded from Google Fonts CDN in `index.html`. |
| Lucide icons | [lucide.dev](https://lucide.dev/) | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | Dashboard chrome only, not the sim canvas. |

Kenney.nl CC0 space/character packs were considered; this demo uses procedural drawing instead so the dashboard bundle stays small and no binary assets need hosting.

Login-page still uses a public archive photograph already in the prior demo for atmosphere; it is captioned as an archive still, not live mission video, and is not a NASA logo.

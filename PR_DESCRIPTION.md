# Pull Request: Product-grade SpaceMoni console + commercial-grade official data

**Branch**: `cursor/coco-demo-mvp-6b90` → `main`  
**HEAD baseline for this iteration**: `93fb7f93723ddc8fb2e1194b8118a8b549aa31ec`

---

## Title
```
Elevate SpaceMoni to product-grade UX and commercial-grade official space-environment data
```

---

## Summary

Raises the coco-demo MVP to a finished operations console without throwing away the clinical light identity.

### Commercial-grade data
- **Live official observations** from NOAA SWPC / GOES (no key): planetary Kp, GOES X-ray class, solar wind speed, ≥10 MeV protons, SWPC alerts — each with timestamp, unit, source URL, and fetch latency.
- **NASA DONKI** catalog (`FLR` / `GST` / `CME`) via `NASA_API_KEY`, falling back to public `DEMO_KEY` with a **visible non-production notice**.
- If DONKI times out or the 7-day window is empty, the UI says so. **No fabricated flares, CMEs, or Kp.**
- Cabin ECLSS and crew vitals remain **simulated demo telemetry**, labelled separately from official feeds.
- `GET /api/nasa/space-environment` caches 60s; `?refresh=1` forces a refetch.

### Two-level AI health analysis
- Shared packing + thresholds in `src/domain/healthPacking.ts` and `healthThresholds.ts`.
- Overall status plus per-metric (HR, HRV, SpO₂, VO₂, sleep, exercise) and per-system analysis.
- Gemini and the offline AURA engine consume the same packed payload; Gemini is instructed not to invent NASA numbers.
- UI shows analysis mode (live Gemini vs offline) and data provenance.

### Product-grade UI/UX
- zh-Hant-TW chrome across login, nav, records, tasks, modals, and AURA.
- Noto Sans TC, clearer hierarchy, skip link, focus-visible rings, `prefers-reduced-motion`.
- Loading / empty / error / DEMO_KEY states on the space-environment panel.
- Roles, demo accounts, and core workflows preserved.

### How to review
```bash
npm install --legacy-peer-deps
npm run dev   # http://localhost:3000
```
Login `alice_smith` / `12345`. Confirm left-rail 「官方空間環境」 shows Kp/GOES with timestamps. Open 「與 AI 通話」 and expand 「詳細健康分析（整體＋逐項）」.

`npm run lint` and `npm run build` both pass.

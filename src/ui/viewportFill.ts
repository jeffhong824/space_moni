/** Porcelain page background used to measure leftover empty cream. */
export const SM_BG = { r: 246, g: 245, b: 241 };
export const MAX_BLANK_RATIO = 0.1;

export function isCreamPixel(
  r: number,
  g: number,
  b: number,
  bg = SM_BG,
  tolerance = 16
): boolean {
  return Math.abs(r - bg.r) <= tolerance && Math.abs(g - bg.g) <= tolerance && Math.abs(b - bg.b) <= tolerance;
}

/** Fraction of pixels that match the empty cream background. */
export function blankPixelRatio(
  data: Uint8ClampedArray | Uint8Array,
  opts?: { tolerance?: number; bg?: { r: number; g: number; b: number } }
): number {
  const bg = opts?.bg ?? SM_BG;
  const tolerance = opts?.tolerance ?? 16;
  const n = Math.floor(data.length / 4);
  if (n <= 0) return 1;
  let blank = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (isCreamPixel(data[o], data[o + 1], data[o + 2], bg, tolerance)) blank += 1;
  }
  return blank / n;
}

/** Height of the empty cream band at the bottom of a screenshot, as a viewport fraction. */
export function bottomEmptyBandRatio(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  opts?: { tolerance?: number; bg?: { r: number; g: number; b: number }; emptyRow?: number }
): number {
  const bg = opts?.bg ?? SM_BG;
  const tolerance = opts?.tolerance ?? 6;
  const emptyRow = opts?.emptyRow ?? 0.82;
  let empty = 0;
  for (let y = height - 1; y >= 0; y--) {
    let cream = 0;
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const o = row + x * 4;
      if (isCreamPixel(data[o], data[o + 1], data[o + 2], bg, tolerance)) cream += 1;
    }
    if (cream / width >= emptyRow) empty += 1;
    else break;
  }
  return height > 0 ? empty / height : 1;
}

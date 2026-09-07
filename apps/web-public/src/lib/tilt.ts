const PATTERN = [-3, 2.5, -1.5, 3, -2, 1.5, -2.5, 2];

/** Deterministic small tilt angle (degrees) for the Nth item in a grid — gives a hand-pinned, not-quite-aligned scrapbook feel without random reflows between renders. */
export function tiltForIndex(index: number, magnitude = 1) {
  return (PATTERN[index % PATTERN.length] ?? 0) * magnitude;
}

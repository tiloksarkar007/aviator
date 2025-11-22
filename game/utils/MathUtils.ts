/**
 * Math Utility Functions
 * Common mathematical operations for game calculations
 */

/**
 * Exponential smoothing interpolation
 * @param factor - Smoothing factor (higher = smoother)
 * @param deltaTime - Time delta in seconds
 * @returns Smoothing factor for interpolation
 */
export function expSmooth(factor: number, deltaTime: number): number {
  return 1 - Math.exp(-factor * deltaTime);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map a value from one range to another
 */
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Apply exponential decay
 */
export function expDecay(value: number, decayRate: number, deltaTime: number): number {
  return value * Math.pow(decayRate, deltaTime);
}

/**
 * Ease out cubic function
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in-out cubic function for smooth S-curve
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smooth step function for elegant transitions
 */
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}


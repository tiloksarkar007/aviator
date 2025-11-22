/**
 * Game Constants and Configuration
 * Centralized configuration for the Aviator game scene
 */

export const COLORS = {
  BG_START: 0x0a0e1a,
  BG_END: 0x0f172a,
  CURVE_START: 0xff006e,
  CURVE_END: 0xe11d48,
  AREA_START: 0xff006e,
  AREA_END: 0xe11d48,
  GRID: 0x1e293b,
  GRID_MAJOR: 0x334155,
  GLOW: 0xff006e,
  TRAIL: 0xff006e,
  EXPLOSION: 0xff6b00,
  EXPLOSION_FIRE: 0xffaa00,
  FLASH: 0xffffff,
} as const;

export const PHYSICS = {
  GRAVITY: 300, // pixels per second squared
  AIR_RESISTANCE: 0.98, // per second
  EXPLOSION_FORCE: 400, // pixels per second
  FLY_AWAY_THRUST: 800, // pixels per second squared
  FLY_AWAY_ANGULAR_VELOCITY: Math.PI * 3, // radians per second
  PARTICLE_FRICTION: 0.95, // per frame
  PARTICLE_GRAVITY: 150, // pixels per second squared
} as const;

export const LAYERS = {
  BACKGROUND: 0,
  GRID: 1,
  CURVE: 2,
  EFFECTS: 3,
  PLANE: 4,
} as const;

export const PERFORMANCE = {
  MAX_POOL_SIZE: 100,
  MOBILE_TRAIL_LENGTH: 20,
  DESKTOP_TRAIL_LENGTH: 40,
  MOBILE_MAX_PARTICLES: 20,
  DESKTOP_MAX_PARTICLES: 40,
  MOBILE_EXPLOSION_PARTICLES: 30,
  DESKTOP_EXPLOSION_PARTICLES: 50,
} as const;

export const RESPONSIVE = {
  MOBILE_BREAKPOINT: 768,
  MOBILE_PADDING: 40,
  DESKTOP_PADDING: 60,
  MOBILE_PLANE_SIZE: 72,
  DESKTOP_PLANE_SIZE: 90,
  MOBILE_LINE_WIDTH: 2.5,
  DESKTOP_LINE_WIDTH: 3.5,
  MOBILE_QUALITY: 0.5,
  DESKTOP_QUALITY: 1.0,
  MOBILE_GRID_SPACING: 40,
  DESKTOP_GRID_SPACING: 60,
} as const;

export const ANIMATION = {
  SMOOTH_FACTOR: 15,
  ROTATION_SMOOTH: 10,
  PULSE_SPEED: 2,
  PULSE_AMOUNT: 0.03,
  HOVER_AMPLITUDE: 3,
} as const;


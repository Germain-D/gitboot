import type { Cls } from '../engine/timeline';
import type { ThemeName } from '../config';

export interface Theme {
  bg: string;
  chrome: string;
  border: string;
  colors: Record<Cls, string>;
  glow: boolean;
  scanlines: boolean;
}

export const THEMES: Record<ThemeName, Theme> = {
  classic: {
    bg: '#300a24',
    chrome: '#3e2a3a',
    border: '#5c3566',
    colors: { prompt: '#8ae234', text: '#eeeeec', ok: '#8ae234', dim: '#75507b', accent: '#fcaf3e' },
    glow: false,
    scanlines: false,
  },
  matrix: {
    bg: '#020a04',
    chrome: '#0a1a0e',
    border: '#0f3d1a',
    colors: { prompt: '#00ff66', text: '#7dffa8', ok: '#00ff66', dim: '#0f5a28', accent: '#00ff66' },
    glow: true,
    scanlines: false,
  },
  cyberpunk: {
    bg: '#0d0221',
    chrome: '#1a0638',
    border: '#ff2a6d',
    colors: { prompt: '#ff2a6d', text: '#d1f7ff', ok: '#05ffa1', dim: '#4a2a7a', accent: '#01c8ff' },
    glow: true,
    scanlines: true,
  },
};

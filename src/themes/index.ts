import type { Cls } from '../engine/timeline';
import type { ThemeName } from '../config';

export interface Theme {
  bg: string;
  chrome: string;
  border: string;
  colors: Record<Cls, string>;
  glow: boolean;
  scanlines: boolean;
  /** window buttons: macOS dots, Windows glyphs on the right, or none */
  chromeStyle: 'mac' | 'win' | 'none';
  /** unix `user@host:~$` or PowerShell `PS C:\Users\user>` */
  promptStyle: 'unix' | 'windows';
  /** fixed window title; defaults to `user@host: ~` */
  title?: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  classic: {
    bg: '#300a24',
    chrome: '#3e2a3a',
    border: '#5c3566',
    colors: { prompt: '#8ae234', text: '#eeeeec', ok: '#8ae234', dim: '#75507b', accent: '#fcaf3e' },
    glow: false,
    scanlines: false,
    chromeStyle: 'mac',
    promptStyle: 'unix',
  },
  matrix: {
    bg: '#020a04',
    chrome: '#0a1a0e',
    border: '#0f3d1a',
    colors: { prompt: '#00ff66', text: '#7dffa8', ok: '#00ff66', dim: '#0f5a28', accent: '#00ff66' },
    glow: true,
    scanlines: false,
    chromeStyle: 'mac',
    promptStyle: 'unix',
  },
  cyberpunk: {
    bg: '#0d0221',
    chrome: '#1a0638',
    border: '#ff2a6d',
    colors: { prompt: '#ff2a6d', text: '#d1f7ff', ok: '#05ffa1', dim: '#4a2a7a', accent: '#01c8ff' },
    glow: true,
    scanlines: true,
    chromeStyle: 'mac',
    promptStyle: 'unix',
  },
  retro: {
    bg: '#1a1100',
    chrome: '#2b1d00',
    border: '#6b4a00',
    colors: { prompt: '#ffb000', text: '#ffc940', ok: '#ffd966', dim: '#7a5500', accent: '#ffb000' },
    glow: true,
    scanlines: true,
    chromeStyle: 'none',
    promptStyle: 'unix',
    title: 'CRT-80  ·  amber phosphor',
  },
  windows: {
    bg: '#012456',
    chrome: '#1f1f1f',
    border: '#3a3a3a',
    colors: { prompt: '#eeedf0', text: '#eeedf0', ok: '#13a10e', dim: '#5b86c4', accent: '#f9f1a5' },
    glow: false,
    scanlines: false,
    chromeStyle: 'win',
    promptStyle: 'windows',
    title: 'Windows PowerShell',
  },
  minimal: {
    bg: '#ffffff',
    chrome: '#f6f8fa',
    border: '#d0d7de',
    colors: { prompt: '#0969da', text: '#1f2328', ok: '#1a7f37', dim: '#afb8c1', accent: '#0969da' },
    glow: false,
    scanlines: false,
    chromeStyle: 'mac',
    promptStyle: 'unix',
  },
  dracula: {
    bg: '#282a36',
    chrome: '#21222c',
    border: '#44475a',
    colors: { prompt: '#50fa7b', text: '#f8f8f2', ok: '#50fa7b', dim: '#6272a4', accent: '#bd93f9' },
    glow: false,
    scanlines: false,
    chromeStyle: 'mac',
    promptStyle: 'unix',
  },
};

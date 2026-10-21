export type ThemeName = 'classic' | 'matrix' | 'cyberpunk' | 'retro' | 'windows' | 'minimal' | 'dracula';

export interface Config {
  username: string;
  hostname: string;
  prompt: string;
  theme: ThemeName;
  logoText: string;
  messages: string[];
  progressBar: boolean;
  cursor: boolean;
  glitch: boolean;
  timestamps: boolean;
  /** milliseconds per typed character */
  speed: number;
  /** accent color override, empty = theme default */
  color: string;
}

export const THEME_NAMES: ThemeName[] = ['classic', 'matrix', 'cyberpunk', 'retro', 'windows', 'minimal', 'dracula'];

export const DEFAULT_CONFIG: Config = {
  username: 'germain',
  hostname: 'github',
  prompt: './profile',
  theme: 'matrix',
  logoText: 'GERMAIN',
  messages: ['Initializing profile...', 'Loading projects...', 'Loading skills...'],
  progressBar: true,
  cursor: true,
  glitch: false,
  timestamps: false,
  speed: 45,
  color: '',
};

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Coerce arbitrary input (URL hash, JSON import) into a valid Config. */
export function normalizeConfig(input: unknown): Config {
  const d = DEFAULT_CONFIG;
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string, max = 64) =>
    typeof v === 'string' ? v.slice(0, max) : fallback;
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  const speed = typeof o.speed === 'number' && isFinite(o.speed) ? o.speed : d.speed;
  return {
    username: str(o.username, d.username, 32),
    hostname: str(o.hostname, d.hostname, 32),
    prompt: str(o.prompt, d.prompt, 48),
    theme: THEME_NAMES.includes(o.theme as ThemeName) ? (o.theme as ThemeName) : d.theme,
    logoText: str(o.logoText, d.logoText, 16),
    messages: Array.isArray(o.messages)
      ? o.messages.filter((m): m is string => typeof m === 'string').map((m) => m.slice(0, 64)).slice(0, 8)
      : d.messages,
    progressBar: bool(o.progressBar, d.progressBar),
    cursor: bool(o.cursor, d.cursor),
    glitch: bool(o.glitch, d.glitch),
    timestamps: bool(o.timestamps, d.timestamps),
    speed: Math.min(120, Math.max(10, Math.round(speed))),
    color: typeof o.color === 'string' && HEX.test(o.color) ? o.color : '',
  };
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeConfig(config: Config): string {
  return toBase64Url(JSON.stringify(config));
}

export function decodeConfig(hash: string): Config {
  const raw = hash.replace(/^#/, '');
  if (!raw) return { ...DEFAULT_CONFIG };
  try {
    return normalizeConfig(JSON.parse(fromBase64Url(raw)));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

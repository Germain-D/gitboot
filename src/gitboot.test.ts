import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, decodeConfig, encodeConfig, normalizeConfig } from './config';
import { buildTimeline } from './engine/timeline';
import { renderSvg } from './engine/svg';
import { buildReadme } from './readme';

describe('config', () => {
  it('round-trips through the URL hash, including non-ASCII', () => {
    const c = normalizeConfig({ ...DEFAULT_CONFIG, username: 'Zoé', color: '#ff0000' });
    expect(decodeConfig('#' + encodeConfig(c))).toEqual(c);
  });
  it('falls back to defaults on garbage', () => {
    expect(decodeConfig('#%%%not-base64')).toEqual(DEFAULT_CONFIG);
  });
  it('clamps and validates fields', () => {
    const c = normalizeConfig({ speed: 9999, theme: 'nope', color: 'red' });
    expect(c.speed).toBe(120);
    expect(c.theme).toBe(DEFAULT_CONFIG.theme);
    expect(c.color).toBe('');
  });
});

describe('timeline', () => {
  it('is deterministic and ordered within the loop', () => {
    const a = buildTimeline(DEFAULT_CONFIG, ['LOGO']);
    expect(buildTimeline(DEFAULT_CONFIG, ['LOGO'])).toEqual(a);
    for (const e of a.events) expect(e.start + e.duration).toBeLessThanOrEqual(a.total);
  });
  it('honours toggles', () => {
    const off = buildTimeline({ ...DEFAULT_CONFIG, progressBar: false, cursor: false });
    expect(off.events.some((e) => e.kind === 'progress')).toBe(false);
    expect(off.cursor).toBeNull();
  });
});

describe('svg + readme', () => {
  it('renders a well-formed, small SVG', () => {
    const svg = renderSvg(DEFAULT_CONFIG, undefined, ['LOGO']);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg.length).toBeLessThan(50_000);
  });
  it('escapes user text', () => {
    const svg = renderSvg({ ...DEFAULT_CONFIG, messages: ['<script>x</script>'] });
    expect(svg).not.toContain('<script>');
  });
  it('readme references the asset', () => {
    expect(buildReadme(DEFAULT_CONFIG)).toContain('assets/boot.svg');
  });
});

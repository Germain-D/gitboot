import type { Config } from '../config';
import { THEMES, type Theme } from '../themes';
import type { Cls, Timeline, TimelineEvent } from './timeline';
import { buildTimeline } from './timeline';

const CHAR_W = 9.6;
const LINE_H = 22;
const FONT_SIZE = 16;
const PAD_X = 24;
const PAD_Y = 20;
const CHROME_H = 36;
const FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono','Liberation Mono',monospace";
const BLINK_MS = 500;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pct = (ms: number, total: number) => +((ms / total) * 100).toFixed(3);

function geometry(e: { row: number; col: number }, text: string) {
  const len = [...text].length;
  return {
    len,
    x: PAD_X + e.col * CHAR_W,
    top: CHROME_H + PAD_Y + e.row * LINE_H,
    w: len * CHAR_W,
  };
}

function textEl(e: TimelineEvent, text: string, extra = ''): string {
  const { x, top, w } = geometry(e, text);
  return `<text x="${x}" y="${top + FONT_SIZE}" class="${e.cls}" textLength="${w}" lengthAdjust="spacing"${extra} xml:space="preserve">${esc(text)}</text>`;
}

function resolveColors(config: Config, theme: Theme): Record<Cls, string> {
  const colors = { ...theme.colors };
  if (config.color) {
    colors.accent = config.color;
    colors.prompt = config.color;
    colors.ok = config.color;
  }
  return colors;
}

function dimensions(tl: Timeline) {
  return {
    width: Math.ceil(PAD_X * 2 + tl.cols * CHAR_W),
    height: CHROME_H + PAD_Y * 2 + tl.rows * LINE_H,
  };
}

function chromeSvg(config: Config, theme: Theme, width: number): string {
  let buttons = '';
  if (theme.chromeStyle === 'mac') {
    buttons = ['#ff5f56', '#ffbd2e', '#27c93f']
      .map((c, i) => `<circle cx="${20 + i * 20}" cy="${CHROME_H / 2}" r="6" fill="${c}"/>`)
      .join('');
  } else if (theme.chromeStyle === 'win') {
    const cy = CHROME_H / 2;
    const stroke = theme.colors.text;
    buttons =
      `<path d="M${width - 98} ${cy}h10M${width - 63} ${cy - 5}h10v10h-10zM${width - 28} ${cy - 5}l10 10m0-10l-10 10" stroke="${stroke}" stroke-width="1.2" fill="none"/>`;
  }
  const title = theme.title ?? `${config.username}@${config.hostname}: ~`;
  const titleX = theme.chromeStyle === 'win' ? 16 : width / 2;
  const anchor = theme.chromeStyle === 'win' ? 'start' : 'middle';
  return (
    `<path d="M0 10a10 10 0 0 1 10-10h${width - 20}a10 10 0 0 1 10 10v${CHROME_H - 10}H0z" fill="${theme.chrome}"/>` +
    buttons +
    `<text x="${titleX}" y="${CHROME_H / 2 + 5}" text-anchor="${anchor}" class="dim" style="font-size:13px">${esc(title)}</text>`
  );
}

function defsSvg(theme: Theme): string {
  return (
    (theme.glow
      ? '<filter id="glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      : '') +
    (theme.scanlines
      ? '<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.28"/></pattern>'
      : '')
  );
}

function baseCss(colors: Record<Cls, string>): string {
  return (
    `text{font-family:${FONT};font-size:${FONT_SIZE}px;white-space:pre}` +
    `.prompt{fill:${colors.prompt}}.text{fill:${colors.text}}.ok{fill:${colors.ok}}.dim{fill:${colors.dim}}.accent{fill:${colors.accent}}`
  );
}

/** Shared window: background, chrome, body group, scanlines. */
function wrap(config: Config, tl: Timeline, css: string, body: string, bodyStyle: string): string {
  const theme = THEMES[config.theme];
  const { width, height } = dimensions(tl);
  const bodyAttrs = [theme.glow ? 'filter="url(#glow)"' : '', bodyStyle].filter(Boolean).join(' ');
  const label = `Terminal boot animation for ${config.username}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">` +
    `<title>${esc(label)}</title><defs>${defsSvg(theme)}</defs><style>${css}</style>` +
    `<rect width="${width}" height="${height}" rx="10" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1.5"/>` +
    chromeSvg(config, theme, width) +
    `<g ${bodyAttrs}>${body}</g>` +
    (theme.scanlines ? `<rect width="${width}" height="${height}" rx="10" fill="url(#scan)" pointer-events="none"/>` : '') +
    '</svg>'
  );
}

function animatedEvent(e: TimelineEvent, i: number, total: number, keyframes: string[]): string {
  const p0 = pct(e.start, total);
  if (e.kind === 'show') {
    keyframes.push(`@keyframes a${i}{0%{opacity:0}${p0}%,100%{opacity:1}}`);
    return `<g style="animation:a${i} ${total}ms step-end infinite">${textEl(e, e.text)}</g>`;
  }
  const { x, top, w, len } = geometry(e, e.text);
  const p1 = pct(e.start + e.duration, total);
  keyframes.push(`@keyframes a${i}{0%,${p0}%{transform:scaleX(0)}${p1}%,100%{transform:scaleX(1)}}`);
  const anim = `animation:a${i} ${total}ms steps(${len},end) infinite`;
  return (
    `<clipPath id="c${i}"><rect x="${x}" y="${top}" width="${w}" height="${LINE_H}" class="k" style="${anim}"/></clipPath>` +
    textEl(e, e.text, ` clip-path="url(#c${i})"`)
  );
}

/** Self-contained animated SVG (CSS keyframes) for embedding in a README. */
export function renderSvg(config: Config, timeline?: Timeline, logoLines: string[] = []): string {
  const tl = timeline ?? buildTimeline(config, logoLines);
  const theme = THEMES[config.theme];
  const colors = resolveColors(config, theme);
  const keyframes: string[] = [];
  let body = tl.events.map((e, i) => animatedEvent(e, i, tl.total, keyframes)).join('');

  if (tl.cursor) {
    const c = tl.cursor;
    const cx = PAD_X + c.col * CHAR_W;
    const cy = CHROME_H + PAD_Y + c.row * LINE_H + 3;
    keyframes.push(`@keyframes cur{0%{opacity:0}${pct(c.start, tl.total)}%,100%{opacity:1}}`);
    body +=
      `<g style="animation:cur ${tl.total}ms step-end infinite">` +
      `<rect x="${cx}" y="${cy}" width="${CHAR_W}" height="${FONT_SIZE}" fill="${colors.text}" class="blink"/></g>`;
  }
  if (config.glitch) {
    keyframes.push(
      '@keyframes glitch{0%,90%,100%{transform:none}91%{transform:translate(-3px,0)}92%{transform:translate(4px,1px)}93%{transform:translate(-2px,-1px)}94%{transform:none}}',
    );
  }

  const css =
    baseCss(colors) +
    '.k{transform-box:fill-box;transform-origin:left center}' +
    `.blink{animation:blink 1s step-end infinite}@keyframes blink{50%{opacity:0}}` +
    keyframes.join('') +
    '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

  return wrap(config, tl, css, body, config.glitch ? 'style="animation:glitch 4s infinite"' : '');
}

function glitchOffset(t: number): string {
  const p = ((t % 4000) / 4000) * 100;
  if (p >= 91 && p < 92) return 'translate(-3 0)';
  if (p >= 92 && p < 93) return 'translate(4 1)';
  if (p >= 93 && p < 94) return 'translate(-2 -1)';
  return '';
}

/** Static snapshot of the screen at time `t` (ms); used to rasterize GIF frames. */
export function renderFrame(config: Config, tl: Timeline, t: number): string {
  const theme = THEMES[config.theme];
  const colors = resolveColors(config, theme);
  let body = '';
  for (const e of tl.events) {
    if (t < e.start) continue;
    if (e.kind === 'show') {
      body += textEl(e, e.text);
      continue;
    }
    const len = [...e.text].length;
    const done = t >= e.start + e.duration;
    const n = done ? len : Math.floor(((t - e.start) / e.duration) * len);
    if (n > 0) body += textEl(e, [...e.text].slice(0, n).join(''));
  }
  if (tl.cursor && t >= tl.cursor.start && Math.floor((t - tl.cursor.start) / BLINK_MS) % 2 === 0) {
    const cx = PAD_X + tl.cursor.col * CHAR_W;
    const cy = CHROME_H + PAD_Y + tl.cursor.row * LINE_H + 3;
    body += `<rect x="${cx}" y="${cy}" width="${CHAR_W}" height="${FONT_SIZE}" fill="${colors.text}"/>`;
  }
  const shift = config.glitch ? glitchOffset(t) : '';
  return wrap(config, tl, baseCss(colors), body, shift ? `transform="${shift}"` : '');
}

export { dimensions };

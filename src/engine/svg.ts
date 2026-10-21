import type { Config } from '../config';
import { THEMES } from '../themes';
import type { Cls, Timeline, TimelineEvent } from './timeline';
import { buildTimeline } from './timeline';

const CHAR_W = 9.6;
const LINE_H = 22;
const FONT_SIZE = 16;
const PAD_X = 24;
const PAD_Y = 20;
const CHROME_H = 36;
const FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono','Liberation Mono',monospace";

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pct = (ms: number, total: number) => +((ms / total) * 100).toFixed(3);

function eventSvg(
  e: TimelineEvent,
  i: number,
  total: number,
  keyframes: string[],
): string {
  const x = PAD_X + e.col * CHAR_W;
  const top = CHROME_H + PAD_Y + e.row * LINE_H;
  const len = [...e.text].length;
  const w = len * CHAR_W;
  const textEl = (clip = '') =>
    `<text x="${x}" y="${top + FONT_SIZE}" class="${e.cls}" textLength="${w}" lengthAdjust="spacing"${clip} xml:space="preserve">${esc(e.text)}</text>`;
  const p0 = pct(e.start, total);

  if (e.kind === 'show') {
    keyframes.push(`@keyframes a${i}{0%{opacity:0}${p0}%,100%{opacity:1}}`);
    return `<g style="animation:a${i} ${total}ms step-end infinite">${textEl()}</g>`;
  }

  const p1 = pct(e.start + e.duration, total);
  keyframes.push(`@keyframes a${i}{0%,${p0}%{transform:scaleX(0)}${p1}%,100%{transform:scaleX(1)}}`);
  const anim = `animation:a${i} ${total}ms steps(${len},end) infinite`;
  return (
    `<clipPath id="c${i}"><rect x="${x}" y="${top}" width="${w}" height="${LINE_H}" class="k" style="${anim}"/></clipPath>` +
    textEl(` clip-path="url(#c${i})"`)
  );
}

export function renderSvg(config: Config, timeline?: Timeline, logoLines: string[] = []): string {
  const tl = timeline ?? buildTimeline(config, logoLines);
  const theme = THEMES[config.theme];
  const colors: Record<Cls, string> = { ...theme.colors };
  if (config.color) {
    colors.accent = config.color;
    colors.prompt = config.color;
    colors.ok = config.color;
  }

  const width = Math.ceil(PAD_X * 2 + tl.cols * CHAR_W);
  const height = CHROME_H + PAD_Y * 2 + tl.rows * LINE_H;
  const keyframes: string[] = [];

  const body = tl.events.map((e, i) => eventSvg(e, i, tl.total, keyframes)).join('');

  let cursor = '';
  if (tl.cursor) {
    const c = tl.cursor;
    const cx = PAD_X + c.col * CHAR_W;
    const cy = CHROME_H + PAD_Y + c.row * LINE_H + 3;
    keyframes.push(`@keyframes cur{0%{opacity:0}${pct(c.start, tl.total)}%,100%{opacity:1}}`);
    cursor =
      `<g style="animation:cur ${tl.total}ms step-end infinite">` +
      `<rect x="${cx}" y="${cy}" width="${CHAR_W}" height="${FONT_SIZE}" fill="${colors.text}" class="blink"/></g>`;
  }

  if (config.glitch) {
    keyframes.push(
      '@keyframes glitch{0%,90%,100%{transform:none}91%{transform:translate(-3px,0)}92%{transform:translate(4px,1px)}93%{transform:translate(-2px,-1px)}94%{transform:none}}',
    );
  }

  const dots = ['#ff5f56', '#ffbd2e', '#27c93f']
    .map((c, i) => `<circle cx="${20 + i * 20}" cy="${CHROME_H / 2}" r="6" fill="${c}"/>`)
    .join('');
  const title = `${config.username}@${config.hostname}: ~`;

  const defs =
    (theme.glow
      ? '<filter id="glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      : '') +
    (theme.scanlines
      ? '<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.28"/></pattern>'
      : '');

  const bodyAttrs = [
    theme.glow ? 'filter="url(#glow)"' : '',
    config.glitch ? `style="animation:glitch 4s infinite"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const css =
    `text{font-family:${FONT};font-size:${FONT_SIZE}px;white-space:pre}` +
    `.prompt{fill:${colors.prompt}}.text{fill:${colors.text}}.ok{fill:${colors.ok}}.dim{fill:${colors.dim}}.accent{fill:${colors.accent}}` +
    `.k{transform-box:fill-box;transform-origin:left center}` +
    `.blink{animation:blink 1s step-end infinite}@keyframes blink{50%{opacity:0}}` +
    keyframes.join('') +
    '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

  const label = `Terminal boot animation for ${config.username}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">` +
    `<title>${esc(label)}</title><defs>${defs}</defs><style>${css}</style>` +
    `<rect width="${width}" height="${height}" rx="10" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1.5"/>` +
    `<path d="M0 10a10 10 0 0 1 10-10h${width - 20}a10 10 0 0 1 10 10v${CHROME_H - 10}H0z" fill="${theme.chrome}"/>` +
    dots +
    `<text x="${width / 2}" y="${CHROME_H / 2 + 5}" text-anchor="middle" class="dim" style="font-size:13px">${esc(title)}</text>` +
    `<g ${bodyAttrs}>${body}${cursor}</g>` +
    (theme.scanlines ? `<rect width="${width}" height="${height}" rx="10" fill="url(#scan)" pointer-events="none"/>` : '') +
    '</svg>'
  );
}

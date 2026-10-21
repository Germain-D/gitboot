import type { Config } from '../config';
import { THEMES } from '../themes';

export type Cls = 'prompt' | 'text' | 'ok' | 'dim' | 'accent';

export interface TimelineEvent {
  kind: 'show' | 'type' | 'progress';
  row: number;
  col: number;
  /** ms from start of the cycle */
  start: number;
  /** ms; 0 for 'show' */
  duration: number;
  text: string;
  cls: Cls;
}

export interface Timeline {
  events: TimelineEvent[];
  rows: number;
  cols: number;
  /** full loop length in ms, including the final hold */
  total: number;
  /** where the blinking cursor sits, and when it appears */
  cursor: { row: number; col: number; start: number } | null;
}

export const PROGRESS_WIDTH = 32;
const HOLD_MS = 3500;
const MIN_COLS = 56;

export function promptText(config: Config): string {
  if (THEMES[config.theme].promptStyle === 'windows') return `PS C:\\Users\\${config.username}> `;
  return `${config.username}@${config.hostname}:~$ `;
}

function stamp(ms: number): string {
  const s = ms / 1000;
  return `[${s.toFixed(2).padStart(5, '0')}] `;
}

/** Pure: Config (+ pre-rendered logo lines) -> ordered screen events. */
export function buildTimeline(config: Config, logoLines: string[] = []): Timeline {
  const events: TimelineEvent[] = [];
  const typeMs = (text: string) => Math.max(1, text.length) * config.speed;
  const prompt = promptText(config);
  let t = 300;
  let row = 0;

  // 1. prompt + command
  events.push({ kind: 'show', row, col: 0, start: t, duration: 0, text: prompt, cls: 'prompt' });
  const cmd = config.prompt;
  events.push({ kind: 'type', row, col: prompt.length, start: t, duration: typeMs(cmd), text: cmd, cls: 'text' });
  t += typeMs(cmd) + 350;
  row++;

  // 2. boot messages
  const tsWidth = config.timestamps ? stamp(0).length : 0;
  let cols = Math.max(MIN_COLS, prompt.length + cmd.length);
  const msgs = config.messages.filter((m) => m.trim() !== '');
  for (const msg of msgs) {
    const line = `> ${msg}`;
    cols = Math.max(cols, tsWidth + line.length + 9);
  }
  const okCol = cols - 5;
  for (const msg of msgs) {
    const line = `> ${msg}`;
    if (config.timestamps) {
      events.push({ kind: 'show', row, col: 0, start: t, duration: 0, text: stamp(t - 300), cls: 'dim' });
    }
    const d = typeMs(line) * 0.6;
    events.push({ kind: 'type', row, col: tsWidth, start: t, duration: d, text: line, cls: 'text' });
    t += d + 120;
    events.push({ kind: 'show', row, col: okCol, start: t, duration: 0, text: '[OK]', cls: 'ok' });
    t += 220;
    row++;
  }

  // 3. progress bar
  if (config.progressBar) {
    row++;
    const track = '░'.repeat(PROGRESS_WIDTH);
    const fill = '█'.repeat(PROGRESS_WIDTH);
    const dur = 1600;
    events.push({ kind: 'show', row, col: 0, start: t, duration: 0, text: track, cls: 'dim' });
    events.push({ kind: 'progress', row, col: 0, start: t, duration: dur, text: fill, cls: 'accent' });
    events.push({ kind: 'show', row, col: PROGRESS_WIDTH + 1, start: t + dur, duration: 0, text: '100%', cls: 'text' });
    t += dur + 400;
    row++;
  }

  // 4. logo + welcome
  row++;
  logoLines.forEach((l, i) => {
    cols = Math.max(cols, l.length);
    events.push({ kind: 'show', row, col: 0, start: t + i * 70, duration: 0, text: l, cls: 'accent' });
    row++;
  });
  if (logoLines.length) t += logoLines.length * 70 + 150;
  const welcome = `Welcome, ${config.username}`;
  events.push({ kind: 'type', row, col: 0, start: t, duration: typeMs(welcome), text: welcome, cls: 'text' });
  t += typeMs(welcome) + 300;
  row += 2;

  // 5. fresh prompt + cursor
  events.push({ kind: 'show', row, col: 0, start: t, duration: 0, text: prompt, cls: 'prompt' });
  const cursor = config.cursor ? { row, col: prompt.length, start: t } : null;

  return { events, rows: row + 1, cols, total: t + HOLD_MS, cursor };
}

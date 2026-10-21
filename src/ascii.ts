import figlet from 'figlet';
import standard from 'figlet/importable-fonts/Standard.js';

figlet.parseFont('Standard', standard);

/** Text -> ASCII-art lines (trailing blank lines and whitespace trimmed). */
export function textToAscii(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const lines = figlet.textSync(t, { font: 'Standard' }).split('\n').map((l) => l.replace(/\s+$/, ''));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

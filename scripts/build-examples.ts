// Regenerates the demo SVGs shown in the README, using the same engine as the web app.
import { mkdirSync, writeFileSync } from 'node:fs';
import { DEFAULT_CONFIG, THEME_NAMES } from '../src/config';
import { textToAscii } from '../src/ascii';
import { renderSvg } from '../src/engine/svg';

mkdirSync('assets', { recursive: true });
for (const theme of THEME_NAMES) {
  const config = { ...DEFAULT_CONFIG, theme, logoText: 'GITBOOT', username: 'you', glitch: theme === 'cyberpunk' };
  const svg = renderSvg(config, undefined, textToAscii(config.logoText));
  writeFileSync(`assets/demo-${theme}.svg`, svg);
  console.log(`assets/demo-${theme}.svg  ${(svg.length / 1024).toFixed(1)} kB`);
}

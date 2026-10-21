import './style.css';
import { THEME_NAMES, decodeConfig, encodeConfig, normalizeConfig, type Config } from './config';
import { textToAscii } from './ascii';
import { renderSvg } from './engine/svg';
import { buildReadme, type ImageFormat } from './readme';
import { buildTimeline } from './engine/timeline';
import { exportGif } from './gif';

let config: Config = decodeConfig(location.hash);

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header><h1>GitBoot</h1><p>Create your GitHub profile boot screen.</p></header>
  <main>
    <form id="form" autocomplete="off">
      <label>Username <input name="username" maxlength="32"></label>
      <label>Hostname <input name="hostname" maxlength="32"></label>
      <label>Command <input name="prompt" maxlength="48"></label>
      <label>Logo text <input name="logoText" maxlength="16"></label>
      <label>Boot messages (one per line)<textarea name="messages" rows="4"></textarea></label>
      <label>Theme <select name="theme">${THEME_NAMES.map((t) => `<option>${t}</option>`).join('')}</select></label>
      <label>Typing delay: <output id="speedOut"></output> ms/char
        <input name="speed" type="range" min="10" max="120" step="5"></label>
      <label>Accent color
        <span class="row"><input name="color" type="color"> <button type="button" id="resetColor">Theme default</button></span>
      </label>
      <label class="check"><input name="progressBar" type="checkbox"> Progress bar</label>
      <label class="check"><input name="cursor" type="checkbox"> Blinking cursor</label>
      <label class="check"><input name="timestamps" type="checkbox"> Timestamps</label>
      <label class="check"><input name="glitch" type="checkbox"> Glitch effect</label>
    </form>
    <section>
      <div id="preview" aria-live="off"></div>
      <div class="actions">
        <button id="copyMd">Copy Markdown</button>
        <button id="dlSvg">Download SVG</button>
        <button id="dlGif">Download GIF</button>
        <select id="format" aria-label="Image format used in the Markdown"><option value="svg">Markdown: SVG</option><option value="gif">Markdown: GIF</option></select>
        <button id="copyLink">Copy link</button>
        <span id="status" role="status"></span>
      </div>
      <details><summary>README preview (Markdown)</summary><pre id="md"></pre></details>
    </section>
  </main>`;

const form = document.querySelector<HTMLFormElement>('#form')!;
const preview = document.querySelector<HTMLDivElement>('#preview')!;
const mdBox = document.querySelector<HTMLPreElement>('#md')!;
const statusEl = document.querySelector<HTMLSpanElement>('#status')!;
const speedOut = document.querySelector<HTMLOutputElement>('#speedOut')!;
const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function fillForm(c: Config) {
  for (const key of ['username', 'hostname', 'prompt', 'logoText', 'theme', 'speed'] as const) {
    field(key).value = String(c[key]);
  }
  field('messages').value = c.messages.join('\n');
  field('color').value = c.color || '#00ff66';
  for (const key of ['progressBar', 'cursor', 'timestamps', 'glitch'] as const) {
    (field(key) as HTMLInputElement).checked = c[key];
  }
}

function readForm(): Config {
  const checked = (n: string) => (field(n) as HTMLInputElement).checked;
  return normalizeConfig({
    username: field('username').value,
    hostname: field('hostname').value,
    prompt: field('prompt').value,
    logoText: field('logoText').value,
    theme: field('theme').value,
    speed: Number(field('speed').value),
    messages: field('messages').value.split('\n'),
    color: colorTouched ? field('color').value : config.color,
    progressBar: checked('progressBar'),
    cursor: checked('cursor'),
    timestamps: checked('timestamps'),
    glitch: checked('glitch'),
  });
}

let colorTouched = false;
const format = () => document.querySelector<HTMLSelectElement>('#format')!.value as ImageFormat;

function render() {
  speedOut.textContent = String(config.speed);
  preview.innerHTML = renderSvg(config, undefined, textToAscii(config.logoText));
  mdBox.textContent = buildReadme(config, format());
  history.replaceState(null, '', `#${encodeConfig(config)}`);
}

function flash(msg: string) {
  statusEl.textContent = msg;
  setTimeout(() => (statusEl.textContent = ''), 2000);
}

async function copy(text: string, ok: string) {
  try {
    await navigator.clipboard.writeText(text);
    flash(ok);
  } catch {
    flash('Copy failed: clipboard unavailable');
  }
}

form.addEventListener('input', (e) => {
  if ((e.target as HTMLElement).getAttribute('name') === 'color') colorTouched = true;
  config = readForm();
  render();
});
document.querySelector('#resetColor')!.addEventListener('click', () => {
  colorTouched = true;
  field('color').value = '#000000';
  config = { ...readForm(), color: '' };
  render();
});
document.querySelector('#copyMd')!.addEventListener('click', () => copy(buildReadme(config, format()), 'Markdown copied'));
document.querySelector('#copyLink')!.addEventListener('click', () => copy(location.href, 'Link copied'));
function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.querySelector('#dlSvg')!.addEventListener('click', () => {
  download(new Blob([renderSvg(config, undefined, textToAscii(config.logoText))], { type: 'image/svg+xml' }), 'boot.svg');
});

const gifBtn = document.querySelector<HTMLButtonElement>('#dlGif')!;
document.querySelector('#format')!.addEventListener('change', render);
gifBtn.addEventListener('click', async () => {
  gifBtn.disabled = true;
  try {
    const tl = buildTimeline(config, textToAscii(config.logoText));
    const blob = await exportGif(config, tl, (r) => (statusEl.textContent = `Encoding GIF… ${Math.round(r * 100)}%`));
    download(blob, 'boot.gif');
    flash(`GIF ready (${(blob.size / 1024).toFixed(0)} kB)`);
  } catch (err) {
    flash(err instanceof Error ? err.message : 'GIF export failed');
  } finally {
    gifBtn.disabled = false;
  }
});

fillForm(config);
render();

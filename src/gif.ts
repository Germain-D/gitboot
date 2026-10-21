import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import type { Config } from './config';
import { dimensions, renderFrame } from './engine/svg';
import type { Timeline } from './engine/timeline';

const STEP_MS = 50;

function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not rasterize SVG frame'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Rasterize the timeline frame by frame and encode an looping GIF. Identical frames are merged. */
export async function exportGif(
  config: Config,
  tl: Timeline,
  onProgress: (ratio: number) => void,
  scale = 1,
): Promise<Blob> {
  const { width, height } = dimensions(tl);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const gif = GIFEncoder();

  // Collapse runs of identical frames into one frame with a longer delay.
  const frames: { svg: string; delay: number }[] = [];
  for (let t = 0; t < tl.total; t += STEP_MS) {
    const svg = renderFrame(config, tl, t);
    const last = frames[frames.length - 1];
    if (last && last.svg === svg) last.delay += STEP_MS;
    else frames.push({ svg, delay: STEP_MS });
  }

  for (let i = 0; i < frames.length; i++) {
    const img = await loadSvg(frames[i].svg);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), w, h, { palette, delay: frames[i].delay });
    onProgress((i + 1) / frames.length);
  }
  gif.finish();
  return new Blob([gif.bytes() as Uint8Array<ArrayBuffer>], { type: 'image/gif' });
}

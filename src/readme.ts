import type { Config } from './config';

export const SVG_PATH = 'assets/boot.svg';

export type ImageFormat = 'svg' | 'gif';

/** Markdown for a profile README that embeds the generated boot screen. */
export function buildReadme(config: Config, format: ImageFormat = 'svg'): string {
  const name = config.username || 'there';
  const imagePath = `assets/boot.${format}`;
  return `<div align="center">

<img src="./${imagePath}" alt="Terminal boot animation for ${name}" width="800">

</div>

<h1 align="center">Hi, I'm ${name} 👋</h1>

<p align="center">
  Developer · Builder · Open Source
</p>

---

## About me

Write a few lines about yourself here.

## Projects

- **project-one**: what it does
- **project-two**: what it does

## Tech stack

\`TypeScript\` · \`Node.js\` · \`...\`

<sub>Boot screen made with GitBoot</sub>
`;
}

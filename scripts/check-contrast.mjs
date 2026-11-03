#!/usr/bin/env node
/**
 * 시대 테마 색 대비 검사 (WCAG 2.x).
 * src/content/eras/*.md 의 theme 색을 읽어 배경(bg) 대비 글자색(fg, muted, accent)이
 * 4.5:1 이상인지 확인한다. muted와 accent도 13–14px 작은 글자에 쓰이므로 같은 기준을 적용한다.
 *
 * 사용: npm run check:contrast
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIN = 4.5;
const dir = join(import.meta.dirname, '..', 'src', 'content', 'eras');

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function readTheme(text) {
  const theme = {};
  for (const key of ['bg', 'fg', 'accent', 'muted']) {
    const m = text.match(new RegExp(`^\\s+${key}:\\s*["']?(#[0-9a-fA-F]{6})`, 'm'));
    if (m) theme[key] = m[1];
  }
  return theme;
}

let failed = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  const theme = readTheme(readFileSync(join(dir, file), 'utf8'));
  if (!theme.bg) {
    console.log(`? ${file}: theme.bg 를 찾지 못함`);
    failed++;
    continue;
  }
  for (const key of ['fg', 'muted', 'accent']) {
    if (!theme[key]) continue;
    const ratio = contrast(theme[key], theme.bg);
    const ok = ratio >= MIN;
    if (!ok) failed++;
    console.log(`${ok ? '✓' : '✗'} ${file} ${key} ${theme[key]} on ${theme.bg}: ${ratio.toFixed(2)}:1`);
  }
}

if (failed > 0) {
  console.error(`\n${failed}개 조합이 ${MIN}:1 미만입니다.`);
  process.exit(1);
}
console.log(`\n모든 조합이 ${MIN}:1 이상입니다.`);

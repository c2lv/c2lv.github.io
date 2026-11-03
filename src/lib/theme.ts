import type { Era } from './archive';

const fontVar = {
  sign: 'var(--font-sign)',
  serif: 'var(--font-serif)',
  hand: 'var(--font-hand)',
} as const;

function eraDeclarations(era: Era): string[] {
  const t = era.data.theme;
  return [
    `--bg: ${t.bg}`,
    `--fg: ${t.fg}`,
    `--accent: ${t.accent}`,
    `--muted: ${t.muted}`,
    `--font-display: ${fontVar[t.font]}`,
  ];
}

/** 빈 사진(.backdrop)이 자기 시대 배경지 색을 갖도록 --bg만 지정한다. */
export function eraBackdropStyle(era: Era): string {
  return `--bg: ${era.data.theme.bg}`;
}

/** 시대 테마를 인라인 style 문자열(CSS 변수)로 변환한다. 상세 페이지 html에 쓴다. */
export function eraStyle(era: Era): string {
  return eraDeclarations(era).join('; ');
}

/**
 * 타임라인 페이지용 시대 테마 CSS.
 * - JS 없음: 각 시대 섹션이 자기 테마 변수를 가진다 (구역별로 색이 나뉨).
 * - JS 있음(html.js-theme): 화면 중앙의 시대를 html[data-active-era]로 표시하고,
 *   html의 변수가 바뀌면 @property 등록된 색 변수가 부드럽게 전환된다.
 */
export function eraThemeCss(eras: Era[]): string {
  return eras
    .map((era) => {
      const id = JSON.stringify(era.id);
      const body = eraDeclarations(era).join('; ');
      // 제목 글꼴은 보간되지 않으므로 JS 유무와 관계없이 각 시대 섹션이 자기 글꼴을 갖는다.
      const font = `.era[data-era=${id}] { --font-display: ${fontVar[era.data.theme.font]}; }`;
      return `html:not(.js-theme) .era[data-era=${id}], html.js-theme[data-active-era=${id}] { ${body}; }
${font}`;
    })
    .join('\n');
}

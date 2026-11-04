import type { Era } from './archive';

const fontVar = {
  sign: 'var(--font-sign)',
  serif: 'var(--font-serif)',
  hand: 'var(--font-hand)',
} as const;

function colorDeclarations(era: Era): string[] {
  const t = era.data.theme;
  return [`--bg: ${t.bg}`, `--fg: ${t.fg}`, `--accent: ${t.accent}`, `--muted: ${t.muted}`];
}

function eraDeclarations(era: Era): string[] {
  return [...colorDeclarations(era), `--font-display: ${fontVar[era.data.theme.font]}`];
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
      const body = colorDeclarations(era).join('; ');
      // 제목 글꼴은 html이 아니라 각 시대 섹션에만 준다. html에 주면 시대가 바뀔 때 사진관 입구 간판
      // 글꼴까지 바뀌어 문서 높이가 달라지고, 브라우저 스크롤 앵커링이 스크롤 위치를 밀어
      // 시대 경계에서 화면이 좌우로 계속 흔들린다.
      const font = `.era[data-era=${id}] { --font-display: ${fontVar[era.data.theme.font]}; }`;
      return `html:not(.js-theme) .era[data-era=${id}], html.js-theme[data-active-era=${id}] { ${body}; }
${font}`;
    })
    .join('\n');
}

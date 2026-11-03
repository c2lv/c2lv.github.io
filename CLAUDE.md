# 밤팔이 사진관

삶의 주요 사건을 시대순으로 보여주는 개인 아카이브. Astro 정적 사이트, GitHub Pages 배포.

## 명령

- `npm run dev` — 개발 서버 (http://localhost:4321)
- `npm run build` — `dist/`에 빌드. 콘텐츠 스키마와 "사건 날짜가 시대 기간 안인지"를 여기서 검사한다.
- `npm run check:contrast` — 시대 테마 색 대비 검사 (4.5:1 이상)

## 콘텐츠

- 시대: `src/content/eras/<id>.md` — `title`, `subtitle`, `start`, `end`(생략 = 현재), `theme`, 본문 = 소개 글
- 사건: `src/content/events/<YYYY-MM-slug>.md` — `title`, `date`, `era`(시대 id), `summary`, `place`, `cover`, `coverAlt`, `importance`(1–3), `tags`, `private`
- 스키마: `src/content.config.ts`
- `private: true`는 빌드에서만 빠진다. 레포가 공개이므로 원본 파일은 누구나 볼 수 있다. 민감한 내용은 레포에 넣지 않는다.
- 커버 사진은 사건 md 옆(또는 `src/assets/`)에 두고 상대 경로로 지정한다. `public/`에 두지 않는다 (자동 압축이 안 됨).

## 디자인

디자인, CSS, 컴포넌트, 시대 테마, 스크롤 동작을 바꾸기 전에 `.claude/skills/life-design/SKILL.md`를 읽는다.
핵심 원칙: 레이아웃은 모든 시대가 공유하고, 시대마다 바뀌는 것은 테마 토큰(색 4개 + 제목 글꼴)뿐이다.

## 배포

`master` push → `.github/workflows/deploy.yml` (withastro/action) → GitHub Pages.
레포 Settings → Pages → Source가 "GitHub Actions"여야 한다.

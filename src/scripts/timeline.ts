/**
 * 타임라인 스크롤 동작.
 *
 * 1. 가로 모드: 넓은 화면에서 세로 스크롤 양을 트랙의 가로 이동(translateX)으로 바꾼다.
 *    .timeline 높이를 (트랙 가로 길이 - 화면 폭 + 화면 높이)로 늘리고, 안쪽은 sticky로 고정한다.
 * 2. 시대 테마: 화면 중앙에 있는 시대를 html[data-active-era]로 표시한다 (색 전환은 CSS).
 * 3. 진행 바와 현재 시대 표시.
 * 4. 가로 모드에서 #앵커 이동과 키보드 포커스 이동을 가로 위치로 변환한다.
 *
 * JS가 없거나 화면이 좁거나 동작 줄이기 설정이면 세로 타임라인 그대로 둔다.
 */

export const HORIZONTAL_QUERY =
  '(min-width: 900px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';

const root = document.documentElement;
const outer = document.querySelector<HTMLElement>('.timeline');
const track = document.querySelector<HTMLElement>('.timeline-track');
const sections = [...document.querySelectorAll<HTMLElement>('.era')];
const progressBar = document.querySelector<HTMLElement>('.progress-bar');
const nowLabel = document.querySelector<HTMLElement>('.now');
const nowTitle = document.querySelector<HTMLElement>('.now-title');
const nowPeriod = document.querySelector<HTMLElement>('.now-period');

const mq = window.matchMedia(HORIZONTAL_QUERY);

let horizontal = false;
let distance = 0; // 트랙이 가로로 움직일 총 거리
let start = 0; // 가로 이동이 시작되는 문서 기준 세로 위치
let activeEra: string | null = null;
let ticking = false;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function layout() {
  if (!outer || !track) return;
  horizontal = mq.matches;
  root.classList.toggle('is-horizontal', horizontal);

  if (!horizontal) {
    outer.style.height = '';
    track.style.transform = '';
    update();
    return;
  }

  distance = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
  outer.style.height = `${distance + window.innerHeight}px`;
  start = outer.getBoundingClientRect().top + window.scrollY;
  update();
}

function update() {
  ticking = false;

  if (horizontal && track) {
    const x = clamp(window.scrollY - start, 0, distance);
    track.style.transform = `translate3d(${-x}px, 0, 0)`;
  }

  // 화면 중앙점을 포함하는 시대 찾기
  const cx = document.documentElement.clientWidth / 2;
  const cy = window.innerHeight / 2;
  const current = sections.find((s) => {
    const r = s.getBoundingClientRect();
    return horizontal ? r.left <= cx && r.right > cx && r.top <= cy && r.bottom > cy : r.top <= cy && r.bottom > cy;
  });
  setActiveEra(current ?? null);

  if (progressBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  }
}

function setActiveEra(section: HTMLElement | null) {
  const id = section?.dataset.era ?? null;
  if (id === activeEra) return;
  activeEra = id;

  if (id) root.dataset.activeEra = id;
  else delete root.dataset.activeEra;

  if (nowLabel && nowTitle && nowPeriod) {
    nowLabel.hidden = !section;
    nowTitle.textContent = section?.dataset.title ?? '';
    nowPeriod.textContent = section?.dataset.period ?? '';
  }
}

function requestUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

/** 요소가 화면에 들어오도록 문서를 스크롤한다. 가로 모드면 가로 위치를 세로 스크롤 값으로 변환한다. */
function scrollToElement(el: HTMLElement, behavior: ScrollBehavior) {
  if (!horizontal || !track || !track.contains(el)) {
    el.scrollIntoView({ behavior, block: 'start' });
    return;
  }
  const rect = el.getBoundingClientRect();
  const offset = rect.left - track.getBoundingClientRect().left;
  // 시대는 왼쪽 끝에 맞추고, 사건 카드는 화면 가운데에 둔다 (가운데 기준으로 현재 시대가 정해지므로).
  const margin = el.classList.contains('era') ? 0 : (document.documentElement.clientWidth - rect.width) / 2;
  window.scrollTo({ top: start + clamp(offset - margin, 0, distance), behavior });
}

function targetFromHash(hash: string): HTMLElement | null {
  if (!hash || hash === '#') return null;
  return document.getElementById(decodeURIComponent(hash.slice(1)));
}

const smooth: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';

// 같은 페이지 #앵커 클릭
document.addEventListener('click', (e) => {
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;
  const target = targetFromHash(link.hash);
  if (!target) return;
  e.preventDefault();
  history.pushState(null, '', link.hash);
  scrollToElement(target, smooth);
});

// 키보드 포커스가 화면 밖 카드로 가면 그 카드가 보이게
document.addEventListener('focusin', (e) => {
  if (!horizontal || !track) return;
  const el = e.target as HTMLElement;
  if (!track.contains(el)) return;
  const r = el.getBoundingClientRect();
  if (r.left < 0 || r.right > document.documentElement.clientWidth) {
    // 브라우저 기본 포커스 스크롤이 끝난 뒤에 덮어써야 한다.
    requestAnimationFrame(() => scrollToElement(el.closest<HTMLElement>('.event') ?? el, 'instant'));
  }
});

// 상세 페이지에서 /#사건id 로 돌아왔을 때의 목표. 글꼴이 늦게 로딩되면 트랙 폭이 바뀌므로
// 사용자가 직접 스크롤하기 전까지는 레이아웃이 바뀔 때마다 위치를 다시 맞춘다.
let pendingTarget = targetFromHash(location.hash);
const clearPending = () => (pendingTarget = null);
for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
  window.addEventListener(type, clearPending, { once: true, passive: true });
}

function relayout() {
  layout();
  if (pendingTarget) scrollToElement(pendingTarget, 'instant');
}

window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', relayout);
mq.addEventListener('change', relayout);
if (track) new ResizeObserver(relayout).observe(track);

window.addEventListener('popstate', () => {
  const target = targetFromHash(location.hash);
  if (target) scrollToElement(target, 'instant');
});

// 브라우저 기본 해시 이동이 스크립트 실행 뒤에 일어나므로 load 후 한 번 더 맞춘다.
if ('scrollRestoration' in history && pendingTarget) history.scrollRestoration = 'manual';
window.addEventListener('load', relayout, { once: true });

relayout();

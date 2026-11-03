import { getCollection, type CollectionEntry } from 'astro:content';

export type Era = CollectionEntry<'eras'>;
export type LifeEvent = CollectionEntry<'events'>;

/** 타임라인에 놓인 사건 하나. */
export interface TimelineItem {
  event: LifeEvent;
  /** 전체 공개 사건 중 순번 (1부터). 사진 기울기와 '몇 번째 사진' 표시에 쓴다. */
  no: number;
  /** 이 사건이 해당 연도의 첫 사건이면 그 연도. 레일 위 연도 표시에 쓴다. */
  newYear: number | null;
}

export interface EraWithEvents {
  era: Era;
  /** 1부터 시작하는 시대 순번 (봉투 번호) */
  chapter: number;
  items: TimelineItem[];
}

export interface Timeline {
  eras: EraWithEvents[];
  total: number;
  firstYear: number | null;
  lastYear: number | null;
}

/** 공개 사건만, 날짜 오름차순. */
export async function getPublicEvents(): Promise<LifeEvent[]> {
  const events = await getCollection('events', ({ data }) => !data.private);
  return events.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

export function yearOf(date: Date): number {
  return date.getUTCFullYear();
}

/**
 * 시대를 시작 연도순으로 정렬하고 각 시대에 속한 공개 사건을 묶는다.
 * 사건 날짜가 소속 시대의 기간을 벗어나면 빌드를 실패시켜 데이터 실수를 바로 드러낸다.
 */
export async function getTimeline(): Promise<Timeline> {
  const eras = (await getCollection('eras')).sort((a, b) => a.data.start - b.data.start);
  const events = await getPublicEvents();

  const numbered = new Map<string, TimelineItem>();
  let prevYear: number | null = null;
  events.forEach((event, i) => {
    const year = yearOf(event.data.date);
    numbered.set(event.id, { event, no: i + 1, newYear: year !== prevYear ? year : null });
    prevYear = year;
  });

  const grouped = eras.map((era, i) => {
    const own = events.filter((e) => e.data.era.id === era.id);
    for (const e of own) {
      const year = yearOf(e.data.date);
      const end = era.data.end ?? Infinity;
      if (year < era.data.start || year > end) {
        throw new Error(
          `사건 "${e.id}"(${year})이 시대 "${era.id}"(${era.data.start}–${era.data.end ?? '현재'}) 기간을 벗어납니다.`,
        );
      }
    }
    return { era, chapter: i + 1, items: own.map((e) => numbered.get(e.id)!) };
  });

  return {
    eras: grouped,
    total: events.length,
    firstYear: events.length ? yearOf(events[0].data.date) : null,
    lastYear: events.length ? yearOf(events[events.length - 1].data.date) : null,
  };
}

export function formatPeriod(era: Era): string {
  return `${era.data.start} – ${era.data.end ?? '현재'}`;
}

/**
 * 필름 카메라 날짜 각인 형식: "07  3  2" (두 자리 연도, 월·일은 공백으로 두 칸 맞춤).
 * DSEG7 글꼴로 표시하며 white-space: pre가 필요하다.
 */
export function formatCameraDate(date: Date): string {
  const yy = String(date.getUTCFullYear() % 100).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, ' ');
  const d = String(date.getUTCDate()).padStart(2, ' ');
  return `${yy} ${m} ${d}`;
}

/** 사진마다 조금씩 다르게 기울이는 각도(도). 순번으로 정해지므로 빌드마다 같다. */
export function tiltOf(no: number): number {
  return (((no * 37) % 7) - 3) * 0.5;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// frontmatter 날짜는 UTC 자정으로 해석되므로 UTC 기준으로 표시해야 날짜가 밀리지 않는다.
const dayFmt = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

const monthFmt = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', timeZone: 'UTC' });

export function formatMonth(date: Date): string {
  return monthFmt.format(date);
}

export function formatDay(date: Date): string {
  return dayFmt.format(date);
}

/** <time datetime> 용 YYYY-MM-DD */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

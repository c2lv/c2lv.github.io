import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, '6자리 hex 색상이어야 합니다 (예: #1f2937)');

/**
 * 시대(챕터). 파일 하나가 하나의 시대이며 본문은 시대 소개 글이다.
 * theme 값은 스크롤이 이 시대에 들어왔을 때 사이트 전체 CSS 변수로 적용된다.
 */
const eras = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/eras' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    start: z.number().int(),
    // 생략하면 현재 진행 중인 시대
    end: z.number().int().optional(),
    theme: z.object({
      bg: hexColor,
      fg: hexColor,
      accent: hexColor,
      muted: hexColor,
      // 시대 제목 글꼴. sign: 간판체(Do Hyeon), serif: Gowun Batang, hand: Gaegu 손글씨
      font: z.enum(['sign', 'serif', 'hand']).default('sign'),
    }),
  }),
});

/**
 * 사건. 파일 하나가 하나의 사건이며 본문은 상세 페이지에 표시된다.
 */
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      era: reference('eras'),
      summary: z.string(),
      place: z.string().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      // 1: 작은 카드, 2: 기본, 3: 크게 강조
      importance: z.number().int().min(1).max(3).default(2),
      tags: z.array(z.string()).default([]),
      // true면 빌드에서 제외된다. 레포 원본에는 남으므로 민감한 내용은 레포에 넣지 말 것.
      private: z.boolean().default(false),
    }),
});

export const collections = { eras, events };
